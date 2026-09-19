import { useEffect, useState } from "react";
import {
  IndianRupee,
  TrendingUp,
  Wallet,
  Package,
  AlertTriangle,
  Boxes,
  Trophy,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../lib/api";
import { Card } from "../components/Card";

interface Overview {
  financial: { totalRevenue: number; totalExpenses: number; netProfit: number; cashBalance: number };
  sales: { dailySales: number; monthlySales: number; growthPercent: number };
  inventory: { totalProducts: number; lowStockItems: number; outOfStockItems: number };
}

interface TopProduct {
  productName: string | null;
  quantitySold: number;
  revenue: number;
}

export const Dashboard = () => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<{ date: string; revenue: number }[]>([]);
  const [topProduct, setTopProduct] = useState<TopProduct | null>(null);

  useEffect(() => {
    api.get("/dashboard/overview").then((res) => setOverview(res.data));
    api.get("/dashboard/revenue-trend").then((res) => setTrend(res.data));
    api.get("/dashboard/top-product-week").then((res) => setTopProduct(res.data));
  }, []);

  if (!overview) return <p className="text-gray-500">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Business Overview</h2>
        <p className="text-sm text-gray-500">Real-time snapshot of your business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Total Revenue"
          value={`₹${overview.financial.totalRevenue.toLocaleString("en-IN")}`}
          icon={<IndianRupee size={20} />}
          accent="blue"
        />
        <Card
          title="Net Profit"
          value={`₹${overview.financial.netProfit.toLocaleString("en-IN")}`}
          icon={<TrendingUp size={20} />}
          accent="green"
        />
        <Card
          title="Cash Balance"
          value={`₹${overview.financial.cashBalance.toLocaleString("en-IN")}`}
          icon={<Wallet size={20} />}
          accent="amber"
        />
        <Card
          title="Total Expenses"
          value={`₹${overview.financial.totalExpenses.toLocaleString("en-IN")}`}
          icon={<IndianRupee size={20} />}
          accent="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Revenue — Last 14 Days</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <Card
            title="Today's Sales"
            value={`₹${overview.sales.dailySales.toLocaleString("en-IN")}`}
          />
          <Card
            title="Monthly Growth"
            value={`${overview.sales.growthPercent > 0 ? "+" : ""}${overview.sales.growthPercent}%`}
          />
          <Card
            title="This Week's Top Product"
            value={topProduct?.productName ? `${topProduct.productName} (${topProduct.quantitySold} sold)` : "No sales yet"}
            icon={<Trophy size={20} />}
            accent="green"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Total Products" value={overview.inventory.totalProducts} icon={<Package size={20} />} />
        <Card
          title="Low Stock Items"
          value={overview.inventory.lowStockItems}
          icon={<AlertTriangle size={20} />}
          accent="amber"
        />
        <Card
          title="Out of Stock"
          value={overview.inventory.outOfStockItems}
          icon={<Boxes size={20} />}
          accent="red"
        />
      </div>
    </div>
  );
};