import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";

export const getBusinessProfile = async (req: Request, res: Response) => {
  const business = await prisma.business.findUnique({ where: { id: req.user!.businessId } });
  if (!business) return res.status(404).json({ message: "Business not found" });
  res.json(business);
};

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  industryType: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  gstNumber: z.string().optional(),
  currency: z.string().optional(),
});

export const updateBusinessProfile = async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const business = await prisma.business.update({
    where: { id: req.user!.businessId },
    data: parsed.data,
  });
  res.json(business);
};
