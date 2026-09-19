import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  creditLimit: z.number().nonnegative().optional(),
});

export const listCustomers = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: { createdAt: "desc" },
  });
  res.json(customers);
};

export const createCustomer = async (req: Request, res: Response) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const customer = await prisma.customer.create({
    data: { ...parsed.data, businessId: req.user!.businessId },
  });
  res.status(201).json(customer);
};

// Simple rule-based customer intelligence:
// High value = top 20% by spend. Inactive = no purchase in 60+ days.
export const getCustomerInsights = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: { businessId: req.user!.businessId },
  });

  const sorted = [...customers].sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent));
  const highValueCutoff = Math.max(1, Math.ceil(sorted.length * 0.2));
  const highValueIds = new Set(sorted.slice(0, highValueCutoff).map((c) => c.id));

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const insights = customers.map((c) => ({
    id: c.id,
    name: c.name,
    totalSpent: c.totalSpent,
    lastPurchaseAt: c.lastPurchaseAt,
    isHighValue: highValueIds.has(c.id),
    isInactive: c.lastPurchaseAt ? c.lastPurchaseAt < sixtyDaysAgo : true,
  }));

  res.json(insights);
};
