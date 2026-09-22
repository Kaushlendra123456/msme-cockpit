import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  gstRatePercent: z.number().min(0).max(100).default(0),
  stockQuantity: z.number().int().nonnegative().default(0),
  minimumStock: z.number().int().nonnegative().default(0),
  supplierId: z.string().uuid().optional(),
});

export const listProducts = async (req: Request, res: Response) => {
  const { search } = req.query;
  const products = await prisma.product.findMany({
    where: {
      businessId: req.user!.businessId,
      isActive: true,
      ...(search
        ? { name: { contains: String(search), mode: "insensitive" } }
        : {}),
    },
    include: { category: true, supplier: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(products);
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

export const createProduct = async (req: Request, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const product = await prisma.product.create({
    data: { ...parsed.data, businessId: req.user!.businessId },
  });

  // Opening stock entry, if any, goes into the ledger for full traceability
  if (product.stockQuantity > 0) {
    await prisma.inventoryLedger.create({
      data: {
        businessId: req.user!.businessId,
        productId: product.id,
        changeType: "ADJUSTMENT",
        quantityDelta: product.stockQuantity,
        resultingStock: product.stockQuantity,
        note: "Opening stock",
      },
    });
  }

  res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ message: "Product not found" });

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ message: "Product not found" });

  // Soft delete - keeps historical sales/purchase records intact
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: "Product deleted" });
};
