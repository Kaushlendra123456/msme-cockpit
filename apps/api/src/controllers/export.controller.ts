import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { toCsv } from "../utils/csv";

const sendCsv = (res: Response, filename: string, csv: string) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
};

export const exportSales = async (req: Request, res: Response) => {
  const sales = await prisma.sale.findMany({
    where: { businessId: req.user!.businessId },
    include: { customer: true },
    orderBy: { saleDate: "desc" },
  });

  const rows = sales.map((s) => ({
    invoiceNumber: s.invoiceNumber,
    customer: s.customer?.name || "Walk-in",
    subtotal: s.subtotal,
    gstAmount: s.gstAmount,
    totalAmount: s.totalAmount,
    paymentStatus: s.paymentStatus,
    saleDate: s.saleDate.toISOString(),
  }));

  sendCsv(res, `sales-export-${Date.now()}.csv`, toCsv(rows));
};

export const exportProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { businessId: req.user!.businessId, isActive: true },
  });

  const rows = products.map((p) => ({
    name: p.name,
    sku: p.sku || "",
    purchasePrice: p.purchasePrice,
    sellingPrice: p.sellingPrice,
    gstRatePercent: p.gstRatePercent,
    stockQuantity: p.stockQuantity,
    minimumStock: p.minimumStock,
  }));

  sendCsv(res, `products-export-${Date.now()}.csv`, toCsv(rows));
};

export const exportCustomers = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: { businessId: req.user!.businessId },
  });

  const rows = customers.map((c) => ({
    name: c.name,
    phone: c.phone || "",
    email: c.email || "",
    totalSpent: c.totalSpent,
    outstandingCredit: c.outstandingCredit,
    creditLimit: c.creditLimit,
  }));

  sendCsv(res, `customers-export-${Date.now()}.csv`, toCsv(rows));
};

export const exportExpenses = async (req: Request, res: Response) => {
  const expenses = await prisma.expense.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: { expenseDate: "desc" },
  });

  const rows = expenses.map((e) => ({
    category: e.category,
    amount: e.amount,
    note: e.note || "",
    expenseDate: e.expenseDate.toISOString(),
  }));

  sendCsv(res, `expenses-export-${Date.now()}.csv`, toCsv(rows));
};
