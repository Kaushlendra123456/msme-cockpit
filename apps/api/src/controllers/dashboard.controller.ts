import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getFinanceOverview = async (req: Request, res: Response) => {
  const businessId = req.user!.businessId;

  const [sales, expenses, products] = await Promise.all([
    prisma.sale.findMany({ where: { businessId } }),
    prisma.expense.findMany({ where: { businessId } }),
    prisma.product.findMany({ where: { businessId, isActive: true } }),
  ]);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const now = new Date();
  const today = sales.filter((s) => s.saleDate.toDateString() === now.toDateString());
  const dailySales = today.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  const thisMonth = sales.filter(
    (s) => s.saleDate.getMonth() === now.getMonth() && s.saleDate.getFullYear() === now.getFullYear()
  );
  const monthlySales = thisMonth.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = sales.filter(
    (s) =>
      s.saleDate.getMonth() === lastMonthDate.getMonth() &&
      s.saleDate.getFullYear() === lastMonthDate.getFullYear()
  );
  const lastMonthSales = lastMonth.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const growthPercent = lastMonthSales > 0 ? ((monthlySales - lastMonthSales) / lastMonthSales) * 100 : 0;

  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minimumStock && p.stockQuantity > 0);
  const outOfStockItems = products.filter((p) => p.stockQuantity === 0);

  res.json({
    financial: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      cashBalance: Number(netProfit.toFixed(2)), // simplified: assumes no external cash sources
    },
    sales: {
      dailySales: Number(dailySales.toFixed(2)),
      monthlySales: Number(monthlySales.toFixed(2)),
      growthPercent: Number(growthPercent.toFixed(1)),
    },
    inventory: {
      totalProducts: products.length,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
    },
  });
};

// Last 14 days of revenue, for the dashboard chart
export const getRevenueTrend = async (req: Request, res: Response) => {
  const businessId = req.user!.businessId;
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const sales = await prisma.sale.findMany({
    where: { businessId, saleDate: { gte: fourteenDaysAgo } },
  });

  const byDay: Record<string, number> = {};
  for (const s of sales) {
    const key = s.saleDate.toISOString().split("T")[0];
    byDay[key] = (byDay[key] || 0) + Number(s.totalAmount);
  }

  const trend = Object.entries(byDay)
    .map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json(trend);
};

// Finds the product with the highest total quantity sold in the last 7 days -
// for the "This Week's Top Product" quick-stats widget on the dashboard.
export const getTopProductThisWeek = async (req: Request, res: Response) => {
  const businessId = req.user!.businessId;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: { businessId, saleDate: { gte: sevenDaysAgo } },
    },
    include: { product: true },
  });

  if (saleItems.length === 0) {
    return res.json({ productName: null, quantitySold: 0, revenue: 0 });
  }

  const byProduct: Record<string, { productName: string; quantitySold: number; revenue: number }> = {};
  for (const item of saleItems) {
    const key = item.productId;
    if (!byProduct[key]) {
      byProduct[key] = { productName: item.product.name, quantitySold: 0, revenue: 0 };
    }
    byProduct[key].quantitySold += item.quantity;
    byProduct[key].revenue += Number(item.subtotal);
  }

  const top = Object.values(byProduct).sort((a, b) => b.quantitySold - a.quantitySold)[0];

  res.json({
    productName: top.productName,
    quantitySold: top.quantitySold,
    revenue: Number(top.revenue.toFixed(2)),
  });
};