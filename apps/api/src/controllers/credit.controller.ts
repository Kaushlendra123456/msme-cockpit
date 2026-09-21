import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { recordPaymentReceived } from "../services/credit.service";

// Overview of every customer's outstanding credit - the core "Credit Ledger"
// screen. Flags anyone over 30 days since their last purchase with an
// outstanding balance as potentially overdue (simple, explainable rule).
export const getCreditOverview = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: { businessId: req.user!.businessId, outstandingCredit: { gt: 0 } },
    orderBy: { outstandingCredit: "desc" },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const overview = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    creditLimit: c.creditLimit,
    outstandingCredit: c.outstandingCredit,
    lastPurchaseAt: c.lastPurchaseAt,
    isOverdue: c.lastPurchaseAt ? c.lastPurchaseAt < thirtyDaysAgo : true,
  }));

  res.json(overview);
};

export const getCustomerLedger = async (req: Request, res: Response) => {
  const entries = await prisma.creditLedgerEntry.findMany({
    where: { customerId: req.params.customerId, businessId: req.user!.businessId },
    orderBy: { createdAt: "desc" },
  });
  res.json(entries);
};

const paymentSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().optional(),
});

// Records a payment a customer makes against their outstanding credit
// (e.g. they come in and clear part or all of their "udhaar").
export const recordPayment = async (req: Request, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const businessId = req.user!.businessId;

  const entry = await prisma.$transaction(async (tx) => {
    return recordPaymentReceived(tx, {
      businessId,
      customerId: parsed.data.customerId,
      amount: parsed.data.amount,
      note: parsed.data.note,
    });
  });

  res.status(201).json(entry);
};

const creditLimitSchema = z.object({
  creditLimit: z.number().nonnegative(),
});

export const updateCreditLimit = async (req: Request, res: Response) => {
  const parsed = creditLimitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.customerId, businessId: req.user!.businessId },
  });
  if (!customer) return res.status(404).json({ message: "Customer not found" });

  const updated = await prisma.customer.update({
    where: { id: req.params.customerId },
    data: { creditLimit: parsed.data.creditLimit },
  });
  res.json(updated);
};
