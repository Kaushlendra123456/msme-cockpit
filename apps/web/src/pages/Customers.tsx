import { useEffect, useState, FormEvent } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface CustomerInsight {
  id: string;
  name: string;
  totalSpent: number;
  isHighValue: boolean;
  isInactive: boolean;
}

export const Customers = () => {
  const { user } = useAuth();
  const canManageCredit = user?.role === "OWNER" || user?.role === "MANAGER";
  const [insights, setInsights] = useState<CustomerInsight[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", creditLimit: "0" });
  const [editingLimitFor, setEditingLimitFor] = useState<string | null>(null);
  const [limitValue, setLimitValue] = useState("");

  const load = () => api.get("/customers/insights").then((res) => setInsights(res.data));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/customers", {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
    });
    setForm({ name: "", phone: "", email: "", creditLimit: "0" });
    load();
  };

  const saveLimit = async (customerId: string) => {
    await api.put(`/credit/customer/${customerId}/limit`, { creditLimit: Number(limitValue) });
    setEditingLimitFor(null);
    setLimitValue("");
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Customers</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 flex-wrap">
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]"
        />
        <input
          type="number"
          placeholder="Credit limit (₹)"
          value={form.creditLimit}
          onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
        />
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Add Customer
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">AI Tag</th>
              <th className="px-4 py-3">Credit Limit</th>
            </tr>
          </thead>
          <tbody>
            {insights.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-3">₹{Number(c.totalSpent).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  {c.isHighValue && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs mr-1">
                      High Value
                    </span>
                  )}
                  {c.isInactive && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-xs">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!canManageCredit ? (
                    <span className="text-xs text-gray-300">—</span>
                  ) : editingLimitFor === c.id ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        autoFocus
                        value={limitValue}
                        onChange={(e) => setLimitValue(e.target.value)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => saveLimit(c.id)}
                        className="text-xs bg-brand-600 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingLimitFor(c.id);
                        setLimitValue("");
                      }}
                      className="text-xs text-brand-600 underline"
                    >
                      Set Limit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Credit limit controls how much "udhaar" (credit) a customer can carry before new credit
        sales are blocked. See the Credit Ledger page to track outstanding balances and payments.
      </p>
    </div>
  );
};