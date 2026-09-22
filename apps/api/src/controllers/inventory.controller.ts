import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { checkAndNotifyStock } from "../services/notification.service";

export const getProductHistory = async (req: Request, res: Response) => {
  const history = await prisma.inventoryLedger.findMany({
    where: { productId: req.params.productId, businessId: req.user!.businessId },
    orderBy: { createdAt: "desc" },
  });
  res.json(history);
};

export const getLowStock = async (req: Request, res: Response) => {
  // Prisma doesn't support comparing two columns directly in `where`,
  // so we fetch active products and filter in memory. Fine at MSME scale.
  const products = await prisma.product.findMany({
    where: { businessId: req.user!.businessId, isActive: true },
  });
  const lowStock = products.filter((p) => p.stockQuantity <= p.minimumStock);
  res.json(lowStock);
};

const adjustSchema = z.object({
  productId: z.string().uuid(),
  quantityDelta: z.number().int(),
  note: z.string().optional(),
});

// Manual stock correction - e.g. damage, theft, physical count mismatch
export const adjustStock = async (req: Request, res: Response) => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const { productId, quantityDelta, note } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, businessId: req.user!.businessId },
    });
    if (!product) throw { status: 404, message: "Product not found" };

    const newStock = product.stockQuantity + quantityDelta;
    if (newStock < 0) throw { status: 400, message: "Stock cannot go negative" };

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newStock },
    });

    await tx.inventoryLedger.create({
      data: {
        businessId: req.user!.businessId,
        productId,
        changeType: "ADJUSTMENT",
        quantityDelta,
        resultingStock: newStock,
        note,
      },
    });

    await checkAndNotifyStock(tx, {
      businessId: req.user!.businessId,
      productId,
      productName: product.name,
      stockQuantity: newStock,
      minimumStock: product.minimumStock,
    });

    return updated;
  });

  res.json(result);
};
