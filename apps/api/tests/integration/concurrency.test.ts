import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/config/prisma";

// Failure-mode / robustness tests for the sale endpoint.
//
// 1. Concurrency / race-condition test: fires many simultaneous sale
//    requests against a product with limited stock. If the transaction
//    isolation in createSale (sale.controller.ts) is correct, exactly as
//    many requests succeed as there is stock for — never more — and the
//    resulting stock never goes negative. This is the kind of bug that
//    a sequential/unit test can never catch, because it only shows up
//    when multiple requests hit the same row at the same instant.
//
// 2. Malformed-input tests: confirms the API responds with a clean 4xx
//    error (not a 500 crash) for bad input — a non-existent product ID
//    and a negative quantity.

const app = createApp();

const runId = Date.now();
const ownerEmail = `concurrency-test-${runId}@test.local`;
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
    businessName: `Concurrency Test Business ${runId}`,
    ownerName: "Test Owner",
    email: ownerEmail,
    password: ownerPassword,
  });
  expect(registerRes.status).toBe(201);
  token = registerRes.body.token;
  businessId = registerRes.body.business.id;

  const productRes = await authedPost("/api/v1/products", {
    name: "Concurrency Test Widget",
    purchasePrice: 50,
    sellingPrice: 100,
    gstRatePercent: 18,
    stockQuantity: 5, // deliberately low — only 5 units available
    minimumStock: 1,
  });
  expect(productRes.status).toBe(201);
  productId = productRes.body.id;
});

afterAll(async () => {
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

describe("Concurrency: simultaneous sales against limited stock", () => {
  it("never oversells — exactly as many concurrent requests succeed as there is stock", async () => {
    const TOTAL_REQUESTS = 10;
    const STOCK_AVAILABLE = 5;

    // Fire all 10 requests at the same instant — this is the key part.
    // If createSale's stock check + decrement isn't properly transactional,
    // several requests could all read "stock = 5" before any of them
    // writes back, and all 10 would succeed — overselling by 5 units.
    const requests = Array.from({ length: TOTAL_REQUESTS }, () =>
      authedPost("/api/v1/sales", {
        items: [{ productId, quantity: 1 }],
        paymentStatus: "PAID",
      })
    );

    const results = await Promise.all(requests);

    const succeeded = results.filter((r) => r.status === 201);
    const failed = results.filter((r) => r.status === 400);

    expect(succeeded).toHaveLength(STOCK_AVAILABLE);
    expect(failed).toHaveLength(TOTAL_REQUESTS - STOCK_AVAILABLE);

    // The real proof: final stock must be exactly 0, never negative.
    const finalProduct = await authedGet(`/api/v1/products/${productId}`);
    expect(finalProduct.body.stockQuantity).toBe(0);
    expect(finalProduct.body.stockQuantity).not.toBeLessThan(0);

    // And the inventory ledger should show exactly 5 SALE entries — no more.
    const ledgerRes = await authedGet(`/api/v1/inventory/${productId}/history`);
    const saleEntries = ledgerRes.body.filter((e: any) => e.changeType === "SALE");
    expect(saleEntries).toHaveLength(STOCK_AVAILABLE);
  });
});

describe("Failure-mode: malformed input handling", () => {
  it("returns 404, not a crash, for a sale against a non-existent product", async () => {
    const res = await authedPost("/api/v1/sales", {
      items: [{ productId: "00000000-0000-0000-0000-000000000000", quantity: 1 }],
      paymentStatus: "PAID",
    });
    expect(res.status).toBe(404);
  });

  it("returns 400, not a crash, for a negative quantity", async () => {
    const res = await authedPost("/api/v1/sales", {
      items: [{ productId, quantity: -5 }],
      paymentStatus: "PAID",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400, not a crash, for an empty items array", async () => {
    const res = await authedPost("/api/v1/sales", {
      items: [],
      paymentStatus: "PAID",
    });
    expect(res.status).toBe(400);
  });
});