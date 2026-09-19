import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";

const expenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  note: z.string().optional(),
  expenseDate: z.string().datetime().optional(),
});

export const createExpense = async (req: Request, res: Response) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const expense = await prisma.expense.create({
    data: {
      businessId: req.user!.businessId,
      category: parsed.data.category,
      amount: parsed.data.amount,
      note: parsed.data.note,
      ...(parsed.data.expenseDate ? { expenseDate: new Date(parsed.data.expenseDate) } : {}),
    },
  });
  res.status(201).json(expense);
};

export const listExpenses = async (req: Request, res: Response) => {
  const expenses = await prisma.expense.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: { expenseDate: "desc" },
  });
  res.json(expenses);
};

export const expenseReport = async (req: Request, res: Response) => {
  const expenses = await prisma.expense.findMany({
    where: { businessId: req.user!.businessId },
  });
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  }
  res.json({ byCategory, total: Object.values(byCategory).reduce((a, b) => a + b, 0) });
};
