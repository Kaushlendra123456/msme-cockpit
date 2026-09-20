import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api } from "../lib/api";

interface ReorderSuggestion {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  avgDailySales: number;
  leadTimeDays: number;
  reorderPoint: number;
  recommendedQty: number;
}

interface HealthScore {
  score: number;
  status: string;
  revenueGrowth: number;
  profitMargin: number;
  inventoryEfficiency: number;
  expenseControl: number;
}

interface ForecastPoint {
  date: string;
  predicted_revenue: number;
  predicted_expenses: number;
  predicted_cash_balance: number;
}

// This is the "AI Insights" screen — surfaces the rule-based reorder engine,
// business health score, and the AI service's cash-flow forecast.
export const Insights = () => {
  const [reorders, setReorders] = useState<ReorderSuggestion[]>([]);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[] | null>(null);
  const [forecastError, setForecastError] = useState("");
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState(30);

  const loadReorders = () => api.get("/intelligence/reorder-suggestions").then((res) => setReorders(res.data));
  const loadHealth = () => api.get("/intelligence/health-score").then((res) => setHealth(res.data));

  const loadForecast = async (h: number) => {
    setForecastError("");
    try {
      const res = await api.get("/intelligence/cash-flow-forecast", { params: { horizon: h } });
      setForecast(res.data.points);
    } catch (err: any) {
      setForecast(null);
      setForecastError(
        err.response?.data?.message || "Could not load the cash flow forecast right now."
      );
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([loadReorders(), loadHealth(), loadForecast(horizon)]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadForecast(horizon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon]);

  const scoreColor =
    health && health.score >= 80
      ? "text-emerald-600"
      : health && health.score >= 50
      ? "text-amber-600"
      : "text-red-600";

  // Chart wants shorter date labels than the full ISO date
  const chartData =
    forecast?.map((p) => ({
      ...p,
      label: new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand-600" size={20} />
          <h2 className="text-xl font-bold text-gray-800">AI Insights</h2>
        </div>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-brand-600 font-medium"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {health && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-8 flex-wrap">
          <div>
            <p className="text-sm text-gray-500">Business Health Score</p>
            <p className={`text-4xl font-bold ${scoreColor}`}>{health.score}/100</p>
            <p className={`text-sm font-medium ${scoreColor}`}>{health.status}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Revenue Growth</p>
              <p className="font-semibold text-gray-800">{Number(health.revenueGrowth).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400">Profit Margin</p>
              <p className="font-semibold text-gray-800">{Number(health.profitMargin).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400">Inventory Efficiency</p>
              <p className="font-semibold text-gray-800">{Number(health.inventoryEfficiency).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400">Expense Control</p>
              <p className="font-semibold text-gray-800">{Number(health.expenseControl).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-600" />
            <p className="text-sm font-semibold text-gray-700">Cash Flow Forecast</p>
          </div>
          <select
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value={30}>Next 30 days</option>
            <option value={90}>Next 90 days</option>
          </select>
        </div>

        {forecastError ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">{forecastError}</p>
            <button
              onClick={() => loadForecast(horizon)}
              className="text-xs text-brand-600 font-medium underline"
            >
              Try Again
            </button>
          </div>
        ) : !forecast ? (
          <p className="text-sm text-gray-400">Loading forecast...</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.ceil(chartData.length / 10)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="predicted_cash_balance"
                name="Cash Balance"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="predicted_revenue"
                name="Revenue"
                stroke="#10b981"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="predicted_expenses"
                name="Expenses"
                stroke="#ef4444"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Baseline projection using a linear trend on recent revenue/expenses — treat this as a
          directional estimate, not a guarantee, especially with limited history.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Smart Reorder Suggestions</p>
        {reorders.length === 0 ? (
          <p className="text-sm text-gray-400">
            No reorder suggestions right now — stock levels look healthy.
          </p>
        ) : (
          <div className="space-y-3">
            {reorders.map((r) => (
              <div
                key={r.id}
                className="border border-brand-100 bg-brand-50 rounded-lg p-4 text-sm"
              >
                <p className="font-medium text-gray-800">{r.productName}</p>
                <p className="text-gray-600 mt-1">
                  Current stock: <strong>{r.currentStock}</strong> · Avg daily sales:{" "}
                  <strong>{Number(r.avgDailySales).toFixed(1)}</strong> · Supplier lead time:{" "}
                  <strong>{r.leadTimeDays} days</strong>
                </p>
                <p className="text-brand-700 font-semibold mt-2">
                  Recommended: Order {r.recommendedQty} units
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};