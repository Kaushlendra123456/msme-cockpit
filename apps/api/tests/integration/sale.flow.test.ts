import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/config/prisma";

// End-to-end test of the core POS transaction: creating a sale should
// atomically (1) create the Sale + SaleItems with the right GST math,
// (2) decrement Product stock, (3) write an InventoryLedger entry,
// (4) update the Customer's credit balance when sold on credit, and
// (5) enforce the customer's credit limit. This hits a real Postgres
// test database — nothing here is mocked — so it catches bugs a pure
// unit test on calculateGst() or wouldExceedCreditLimit() alone can't.

const app = createApp();

// Each test file run uses a fresh business (unique email) so tests never
// collide with data from a previous run and don't need complex teardown
// of foreign-key-linked rows between tests.
const runId = Date.now();
const ownerEmail = `sale-flow-${runId}@test.local`;
const ownerPassword = "test-password-123";

let token: string;
let businessId: string;
let productId: string;

async function authedPost(url: string, body: object) {
  return request(app).post(url).set("Authorization", `Bearer ${token}`).send(body);
}
async function authedGet(url: string) {
  return request(app).get(url).set("Authorization", `Bearer ${token}`);
}

beforeAll(async () => {
  const registerRes = await request(app).post("/api/v1/auth/register").send({
    businessName: `Sale Flow Test Business ${runId}`,
    ownerName: "Test Owner",
    email: ownerEmail,
    password: ownerPassword,
  });
  expect(registerRes.status).toBe(201);
  token = registerRes.body.token;
  businessId = registerRes.body.business.id;

  const productRes = await authedPost("/api/v1/products", {
    name: "Integration Test Widget",
    purchasePrice: 100,
    sellingPrice: 200,
    gstRatePercent: 18,
    stockQuantity: 10,
    minimumStock: 2,
  });
  expect(productRes.status).toBe(201);
  productId = productRes.body.id;
});

afterAll(async () => {
  // Clean up everything this test run created, then close the Prisma
  // connection so Jest can exit cleanly.
  await prisma.creditLedgerEntry.deleteMany({ where: { businessId } });
  await prisma.notification.deleteMany({ where: { businessId } });
  await prisma.saleItem.deleteMany({ where: { sale: { businessId } } });
  await prisma.sale.deleteMany({ where: { businessId } });
  await prisma.inventoryLedger.deleteMany({ where: { businessId } });
  await prisma.customer.deleteMany({ where: { businessId } });
  await prisma.product.deleteMany({ where: { businessId } });
  await prisma.user.deleteMany({ where: { businessId } });
  await prisma.business.delete({ where: { id: businessId } });
  await prisma.$disconnect();
});

describe("POST /api/v1/sales — full transaction flow", () => {
  it("creates a sale with correct GST totals, decrements stock, and writes a ledger entry", async () => {
    const beforeProduct = await authedGet(`/api/v1/products/${productId}`);
    const stockBefore = beforeProduct.body.stockQuantity;

    const saleRes = await authedPost("/api/v1/sales", {
      items: [{ productId, quantity: 3 }],
      paymentStatus: "PAID",
    });

    expect(saleRes.status).toBe(201);
    // 3 units * ₹200 = ₹600 subtotal, 18% GST = ₹108, total ₹708
    // Prisma Decimal fields serialize as strings in JSON — wrap in Number() before comparing.
    expect(Number(saleRes.body.subtotal)).toBe(600);
    expect(Number(saleRes.body.gstAmount)).toBe(108);
    expect(Number(saleRes.body.totalAmount)).toBe(708);
    expect(saleRes.body.items).toHaveLength(1);

    const afterProduct = await authedGet(`/api/v1/products/${productId}`);
    expect(afterProduct.body.stockQuantity).toBe(stockBefore - 3);

    const ledgerRes = await authedGet(`/api/v1/inventory/${productId}/history`);
    const saleEntry = ledgerRes.body.find(
      (entry: any) => entry.changeType === "SALE" && entry.quantityDelta === -3
    );
    expect(saleEntry).toBeDefined();
    expect(saleEntry.resultingStock).toBe(stockBefore - 3);
  });

  it("rejects a sale when the requested quantity exceeds available stock", async () => {
    const productRes = await authedGet(`/api/v1/products/${productId}`);
    const stockBefore = productRes.body.stockQuantity;

    const saleRes = await authedPost("/api/v1/sales", {
      items: [{ productId, quantity: stockBefore + 1000 }],
      paymentStatus: "PAID",
    });

    expect(saleRes.status).toBe(400);

    // Stock must be unchanged — the whole transaction should have rolled back.
    const afterProduct = await authedGet(`/api/v1/products/${productId}`);
    expect(afterProduct.body.stockQuantity).toBe(stockBefore);
  });

  it("records a credit sale and updates the customer's outstanding credit", async () => {
    const customerRes = await authedPost("/api/v1/customers", {
      name: "Credit Test Customer",
      creditLimit: 5000,
    });
    expect(customerRes.status).toBe(201);
    const customerId = customerRes.body.id;

    const saleRes = await authedPost("/api/v1/sales", {
      customerId,
      items: [{ productId, quantity: 1 }],
      paymentStatus: "PENDING",
    });

    expect(saleRes.status).toBe(201);
    // 1 unit * ₹200 + 18% GST = ₹236
    expect(Number(saleRes.body.totalAmount)).toBe(236);

    const customersRes = await authedGet("/api/v1/customers");
    const updatedCustomer = customersRes.body.find((c: any) => c.id === customerId);
    expect(Number(updatedCustomer.outstandingCredit)).toBe(236);
  });

  it("blocks a credit sale that would exceed the customer's credit limit", async () => {
    const customerRes = await authedPost("/api/v1/customers", {
      name: "Over Limit Customer",
      creditLimit: 100, // less than a single unit's total (₹236)
    });
    const customerId = customerRes.body.id;

    const stockBeforeRes = await authedGet(`/api/v1/products/${productId}`);
    const stockBefore = stockBeforeRes.body.stockQuantity;

    const saleRes = await authedPost("/api/v1/sales", {
      customerId,
      items: [{ productId, quantity: 1 }],
      paymentStatus: "PENDING",
    });

    expect(saleRes.status).toBe(400);

    // Nothing should have been committed: stock unchanged, no credit recorded.
    const stockAfterRes = await authedGet(`/api/v1/products/${productId}`);
    expect(stockAfterRes.body.stockQuantity).toBe(stockBefore);

    const customersRes = await authedGet("/api/v1/customers");
    const untouchedCustomer = customersRes.body.find((c: any) => c.id === customerId);
    expect(Number(untouchedCustomer.outstandingCredit)).toBe(0);
  });
});