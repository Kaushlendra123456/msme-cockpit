import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../lib/api";

// Downloads a protected CSV endpoint as a blob (can't use a plain <a href>
// here since the request needs the JWT Authorization header) and triggers
// a browser save-as using an object URL.
const downloadFile = async (endpoint: string, filenameFallback: string) => {
  const res = await api.get(endpoint, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filenameFallback);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const EXPORTS = [
  { label: "Sales", endpoint: "/export/sales", filename: "sales-export.csv" },
  { label: "Products", endpoint: "/export/products", filename: "products-export.csv" },
  { label: "Customers", endpoint: "/export/customers", filename: "customers-export.csv" },
  { label: "Expenses", endpoint: "/export/expenses", filename: "expenses-export.csv" },
];

export const Reports = () => {
  const [trend, setTrend] = useState<{ date: string; revenue: number }[]>([]);
  const [byCategory, setByCategory] = useState<{ category: string; amount: number }[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    api.get("/dashboard/revenue-trend").then((res) => setTrend(res.data));
    api.get("/expenses/report").then((res) =>
      setByCategory(Object.entries(res.data.byCategory).map(([category, amount]) => ({
        category,
        amount: amount as number,
      })))
    );
  }, []);

  const handleExport = async (endpoint: string, filename: string) => {
    setDownloading(filename);
    try {
      await downloadFile(endpoint, filename);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Reports</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Export Data (CSV)</p>
        <div className="flex flex-wrap gap-3">
          {EXPORTS.map((exp) => (
            <button
              key={exp.endpoint}
              onClick={() => handleExport(exp.endpoint, exp.filename)}
              disabled={downloading === exp.filename}
              className="flex items-center gap-2 text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={14} />
              {downloading === exp.filename ? "Downloading..." : exp.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCategory}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
