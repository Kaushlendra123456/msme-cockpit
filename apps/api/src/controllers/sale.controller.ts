import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { calculateGst } from "../utils/gst";
import { recordCreditSale } from "../services/credit.service";
import { checkAndNotifyStock, notifyNewSale } from "../services/notification.service";
import { generateInvoicePDF } from "../services/invoice.service";

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(saleItemSchema).min(1),
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID"]).default("PAID"),
});

// This is the core POS transaction: creates the invoice, GST breakdown,
// decrements stock, and writes an inventory ledger entry - all atomically.
export const createSale = async (req: Request, res: Response) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const { customerId, items, paymentStatus } = parsed.data;
  const businessId = req.user!.businessId;

  const sale = await prisma.$transaction(async (tx) => {
    let subtotal = 0;
    let gstAmount = 0;
    const saleItemsData: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      gstRatePercent: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, businessId },
      });
      if (!product) throw { status: 404, message: `Product ${item.productId} not found` };
      if (product.stockQuantity < item.quantity) {
        throw { status: 400, message: `Insufficient stock for ${product.name}` };
      }

      const lineSubtotal = Number(product.sellingPrice) * item.quantity;
      const gst = calculateGst(lineSubtotal, Number(product.gstRatePercent));

      subtotal += lineSubtotal;
      gstAmount += gst.gstAmount;

      saleItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: Number(product.sellingPrice),
        gstRatePercent: Number(product.gstRatePercent),
        subtotal: lineSubtotal,
      });

      const newStock = product.stockQuantity - item.quantity;
      await tx.product.update({ where: { id: product.id }, data: { stockQuantity: newStock } });
      await tx.inventoryLedger.create({
        data: {
          businessId,
          productId: product.id,
          changeType: "SALE",
          quantityDelta: -item.quantity,
          resultingStock: newStock,
        },
      });

      await checkAndNotifyStock(tx, {
        businessId,
        productId: product.id,
        productName: product.name,
        stockQuantity: newStock,
        minimumStock: product.minimumStock,
      });
    }

    const totalAmount = Number((subtotal + gstAmount).toFixed(2));
    const invoiceNumber = `INV-${Date.now()}`;

    const createdSale = await tx.sale.create({
      data: {
        businessId,
        invoiceNumber,
        customerId,
        subtotal,
        gstAmount,
        totalAmount,
        paymentStatus,
        items: { create: saleItemsData },
      },
      include: { items: true },
    });

    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: { totalSpent: { increment: totalAmount }, lastPurchaseAt: new Date() },
      });

      // If this sale wasn't fully paid upfront, it's a credit sale -
      // record it in the ledger and enforce the customer's credit limit.
      if (paymentStatus !== "PAID") {
        await recordCreditSale(tx, {
          businessId,
          customerId,
          amount: totalAmount,
          saleId: createdSale.id,
        });
      }
    }

    await notifyNewSale(tx, {
      businessId,
      invoiceNumber: createdSale.invoiceNumber,
      totalAmount,
      saleId: createdSale.id,
    });

    return createdSale;
  });

  res.status(201).json(sale);
};

export const listSales = async (req: Request, res: Response) => {
  const sales = await prisma.sale.findMany({
    where: { businessId: req.user!.businessId },
    include: { items: true, customer: true },
    orderBy: { saleDate: "desc" },
    take: 100,
  });
  res.json(sales);
};

export const getSale = async (req: Request, res: Response) => {
  const sale = await prisma.sale.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
    include: { items: { include: { product: true } }, customer: true },
  });
  if (!sale) return res.status(404).json({ message: "Sale not found" });
  res.json(sale);
};

export const getCustomerHistory = async (req: Request, res: Response) => {
  const sales = await prisma.sale.findMany({
    where: { customerId: req.params.customerId, businessId: req.user!.businessId },
    include: { items: true },
    orderBy: { saleDate: "desc" },
  });
  res.json(sales);
};

// Generates and streams a GST-compliant PDF invoice for a given sale.
export const downloadInvoice = async (req: Request, res: Response) => {
  const sale = await prisma.sale.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
    include: {
      items: { include: { product: true } },
      customer: true,
      business: true,
    },
  });

  if (!sale) {
    return res.status(404).json({ message: "Sale not found" });
  }

  generateInvoicePDF(
    {
      invoiceNumber: sale.invoiceNumber,
      saleDate: sale.saleDate,
      business: {
        name: sale.business.name,
        gstNumber: sale.business.gstNumber,
        location: sale.business.location,
      },
      customer: sale.customer
        ? {
            name: sale.customer.name,
            phone: sale.customer.phone,
            address: sale.customer.address,
          }
        : null,
      items: sale.items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        gstRatePercent: Number(item.gstRatePercent),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(sale.subtotal),
      gstAmount: Number(sale.gstAmount),
      totalAmount: Number(sale.totalAmount),
      paymentStatus: sale.paymentStatus,
    },
    res
  );
};