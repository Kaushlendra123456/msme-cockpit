import { useEffect, useState, FormEvent } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Expense {
  id: string;
  category: string;
  amount: number;
  note?: string;
  expenseDate: string;
}

const CATEGORIES = ["Salary", "Rent", "Electricity", "Transport", "Marketing", "Other"];

export const Expenses = () => {
  const { user } = useAuth();
  const canAddExpense = user?.role === "OWNER" || user?.role === "MANAGER";
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ category: "Rent", amount: "", note: "" });

  const load = () => {
    api.get("/expenses").then((res) => setExpenses(res.data));
    api.get("/expenses/report").then((res) => setByCategory(res.data.byCategory));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/expenses", { category: form.category, amount: Number(form.amount), note: form.note || undefined });
    setForm({ category: "Rent", amount: "", note: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Finance — Expenses</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(byCategory).map(([cat, amt]) => (
          <div key={cat} className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">{cat}</p>
            <p className="text-sm font-semibold text-gray-800">₹{amt.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      {canAddExpense ? (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 flex-wrap">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
          />
          <input
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]"
          />
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Add Expense
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-400">Only Owner/Manager can add expenses. You can view them below.</p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{e.category}</td>
                <td className="px-4 py-3">₹{e.amount}</td>
                <td className="px-4 py-3 text-gray-500">{e.note || "-"}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(e.expenseDate).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};