import { prisma } from "../config/prisma";

// Business Health Score (0-100), rule-based composite of 4 signals:
// - Revenue growth (month over month)
// - Profit margin
// - Inventory efficiency (% of products NOT low/out of stock)
// - Expense control (expenses as a % of revenue, lower is better)
// Each signal is normalized to 0-25 points.
export const computeHealthScore = async (businessId: string) => {
  // If the business has no transaction history at all yet, don't compute a
  // misleading score from empty-data defaults — be honest that there's
  // nothing to evaluate yet.
  const [anySale, anyProduct, anyExpense] = await Promise.all([
    prisma.sale.count({ where: { businessId } }),
    prisma.product.count({ where: { businessId } }),
    prisma.expense.count({ where: { businessId } }),
  ]);

  if (anySale === 0 && anyProduct === 0 && anyExpense === 0) {
    return {
      id: null,
      businessId,
      score: 0,
      revenueGrowth: 0,
      profitMargin: 0,
      inventoryEfficiency: 0,
      expenseControl: 0,
      computedAt: new Date(),
      status: "Not enough data yet",
    };
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonthSales, lastMonthSales, expenses, products] = await Promise.all([
    prisma.sale.findMany({ where: { businessId, saleDate: { gte: thisMonthStart } } }),
    prisma.sale.findMany({
      where: { businessId, saleDate: { gte: lastMonthStart, lt: thisMonthStart } },
    }),
    prisma.expense.findMany({ where: { businessId, expenseDate: { gte: thisMonthStart } } }),
    prisma.product.findMany({ where: { businessId, isActive: true } }),
  ]);

  const thisMonthRevenue = thisMonthSales.reduce((s, x) => s + Number(x.totalAmount), 0);
  const lastMonthRevenue = lastMonthSales.reduce((s, x) => s + Number(x.totalAmount), 0);
  const monthExpenses = expenses.reduce((s, x) => s + Number(x.amount), 0);

  // 1. Revenue growth score
  const revenueGrowth =
    lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  const revenueGrowthScore = Math.max(0, Math.min(25, 12.5 + revenueGrowth / 4));

  // 2. Profit margin score
  const profitMargin = thisMonthRevenue > 0 ? ((thisMonthRevenue - monthExpenses) / thisMonthRevenue) * 100 : 0;
  const profitMarginScore = Math.max(0, Math.min(25, (profitMargin / 40) * 25));

  // 3. Inventory efficiency score
  const healthyStockCount = products.filter((p) => p.stockQuantity > p.minimumStock).length;
  const inventoryEfficiency = products.length > 0 ? (healthyStockCount / products.length) * 100 : 100;
  const inventoryEfficiencyScore = (inventoryEfficiency / 100) * 25;

  // 4. Expense control score (lower expense ratio = better, capped at 60% ratio)
  const expenseRatio = thisMonthRevenue > 0 ? (monthExpenses / thisMonthRevenue) * 100 : 0;
  const expenseControlScore = Math.max(0, Math.min(25, 25 - (expenseRatio / 60) * 25));

  const score = Math.round(
    revenueGrowthScore + profitMarginScore + inventoryEfficiencyScore + expenseControlScore
  );

  const saved = await prisma.businessHealthScore.create({
    data: {
      businessId,
      score,
      revenueGrowth,
      profitMargin,
      inventoryEfficiency,
      expenseControl: 100 - expenseRatio,
    },
  });

  const status = score >= 80 ? "Healthy" : score >= 50 ? "Needs Attention" : "At Risk";

  return { ...saved, status };
};