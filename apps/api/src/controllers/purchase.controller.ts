import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";

const purchaseItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().nonnegative(),
});

const createPurchaseSchema = z.object({
  supplierId: z.string().uuid().optional(),
  items: z.array(purchaseItemSchema).min(1),
});

export const createPurchase = async (req: Request, res: Response) => {
  const parsed = createPurchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const { supplierId, items } = parsed.data;
  const businessId = req.user!.businessId;

  const purchase = await prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    for (const item of items) totalAmount += item.unitCost * item.quantity;

    const poNumber = `PO-${Date.now()}`;
    const created = await tx.purchase.create({
      data: {
        businessId,
        supplierId,
        poNumber,
        totalAmount,
        status: "RECEIVED", // simplified: goods received immediately on entry
        items: { create: items },
      },
      include: { items: true },
    });

    // Receiving a purchase increases stock immediately in this simplified flow
    for (const item of items) {
      const product = await tx.product.findFirst({ where: { id: item.productId, businessId } });
      if (!product) throw { status: 404, message: `Product ${item.productId} not found` };

      const newStock = product.stockQuantity + item.quantity;
      await tx.product.update({ where: { id: product.id }, data: { stockQuantity: newStock } });
      await tx.inventoryLedger.create({
        data: {
          businessId,
          productId: product.id,
          changeType: "PURCHASE",
          quantityDelta: item.quantity,
          resultingStock: newStock,
          referenceId: created.id,
        },
      });
    }

    return created;
  });

  res.status(201).json(purchase);
};

export const listPurchases = async (req: Request, res: Response) => {
  const purchases = await prisma.purchase.findMany({
    where: { businessId: req.user!.businessId },
    include: { items: true, supplier: true },
    orderBy: { purchaseDate: "desc" },
    take: 100,
  });
  res.json(purchases);
};
