import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";

const supplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  avgDeliveryDays: z.number().int().positive().default(7),
  rating: z.number().min(0).max(5).optional(),
});

export const listSuppliers = async (req: Request, res: Response) => {
  const suppliers = await prisma.supplier.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: { createdAt: "desc" },
  });
  res.json(suppliers);
};

export const createSupplier = async (req: Request, res: Response) => {
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const supplier = await prisma.supplier.create({
    data: { ...parsed.data, businessId: req.user!.businessId },
  });
  res.status(201).json(supplier);
};

// Ranks suppliers by a simple weighted score: rating (quality) + delivery speed
export const getRecommendedSuppliers = async (req: Request, res: Response) => {
  const suppliers = await prisma.supplier.findMany({
    where: { businessId: req.user!.businessId },
  });

  const scored = suppliers.map((s) => {
    const ratingScore = Number(s.rating || 3) / 5; // normalize to 0-1
    const speedScore = 1 / Math.max(1, s.avgDeliveryDays || 7); // faster = higher
    const score = ratingScore * 0.6 + speedScore * 0.4;
    return { ...s, recommendationScore: Number(score.toFixed(3)) };
  });

  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  res.json(scored);
};
