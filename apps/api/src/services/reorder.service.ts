import { prisma } from "../config/prisma";

// Rule-based reorder point calculation:
// reorderPoint = avgDailySales * leadTimeDays
// recommendedQty = reorderPoint - currentStock + safetyBuffer(avgDailySales * 2)
// This runs entirely on data we already have — no ML training needed for a
// solid first version. It becomes a good baseline the AI service can later
// refine with a real demand-forecasting model.
export const computeReorderSuggestions = async (businessId: string) => {
  const products = await prisma.product.findMany({
    where: { businessId, isActive: true },
    include: { supplier: true },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const suggestions = [];

  for (const product of products) {
    const recentSales = await prisma.saleItem.findMany({
      where: {
        productId: product.id,
        sale: { businessId, saleDate: { gte: thirtyDaysAgo } },
      },
    });

    const totalSoldLast30Days = recentSales.reduce((sum, item) => sum + item.quantity, 0);
    const avgDailySales = totalSoldLast30Days / 30;
    const leadTimeDays = product.supplier?.avgDeliveryDays || 7;

    const reorderPoint = Math.ceil(avgDailySales * leadTimeDays);
    const safetyBuffer = Math.ceil(avgDailySales * 2);

    if (product.stockQuantity <= reorderPoint || product.stockQuantity <= product.minimumStock) {
      const recommendedQty = Math.max(
        reorderPoint - product.stockQuantity + safetyBuffer,
        product.minimumStock
      );

      const saved = await prisma.reorderSuggestion.create({
        data: {
          businessId,
          productId: product.id,
          currentStock: product.stockQuantity,
          avgDailySales,
          leadTimeDays,
          reorderPoint,
          recommendedQty,
        },
      });

      suggestions.push({ ...saved, productName: product.name });
    }
  }

  return suggestions;
};
