import axios from "axios";
import { prisma } from "../config/prisma";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Builds the daily revenue/expense history the AI service needs, from the
// last N days of real transactions, then calls the FastAPI forecasting
// endpoint. Kept in the Node backend (rather than called directly from the
// frontend) so the AI service's URL/network never has to be exposed to the
// browser, and so this can later be cached/rate-limited in one place.
export const getCashFlowForecast = async (businessId: string, horizonDays: number = 30) => {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({ where: { businessId, saleDate: { gte: ninetyDaysAgo } } }),
    prisma.expense.findMany({ where: { businessId, expenseDate: { gte: ninetyDaysAgo } } }),
  ]);

  const byDay: Record<string, { revenue: number; expenses: number }> = {};

  for (const s of sales) {
    const key = s.saleDate.toISOString().split("T")[0];
    if (!byDay[key]) byDay[key] = { revenue: 0, expenses: 0 };
    byDay[key].revenue += Number(s.totalAmount);
  }
  for (const e of expenses) {
    const key = e.expenseDate.toISOString().split("T")[0];
    if (!byDay[key]) byDay[key] = { revenue: 0, expenses: 0 };
    byDay[key].expenses += Number(e.amount);
  }

  const history = Object.entries(byDay)
    .map(([date, v]) => ({ date, revenue: v.revenue, expenses: v.expenses }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (history.length === 0) {
    throw {
      status: 400,
      message: "Not enough sales/expense history yet to generate a forecast. Record a few transactions first.",
    };
  }

  try {
    // 60 second timeout: on free-tier hosting, the AI service may be
    // "asleep" after inactivity and can take 30-50s to wake up on the
    // first request. A short timeout would incorrectly report it as down.
    const response = await axios.post(
      `${AI_SERVICE_URL}/forecast/cash-flow`,
      { history, horizon_days: horizonDays },
      { timeout: 60000 }
    );
    return response.data;
  } catch (err: any) {
    const isTimeout = err.code === "ECONNABORTED";
    throw {
      status: 503,
      message: isTimeout
        ? "The AI forecasting service is waking up (this can take up to a minute on free hosting after inactivity). Please try again in a moment."
        : "The AI forecasting service is not reachable right now. Please try again shortly.",
    };
  }
};