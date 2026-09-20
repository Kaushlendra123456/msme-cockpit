import { useEffect, useState, FormEvent } from "react";
import { api } from "../lib/api";

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  avgDeliveryDays: number;
  rating?: number;
  recommendationScore?: number;
}

export const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", avgDeliveryDays: "7" });

  const load = () => api.get("/suppliers/recommended").then((res) => setSuppliers(res.data));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/suppliers", {
      name: form.name,
      phone: form.phone || undefined,
      avgDeliveryDays: Number(form.avgDeliveryDays),
    });
    setForm({ name: "", phone: "", avgDeliveryDays: "7" });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Suppliers</h2>
      <p className="text-sm text-gray-500">Ranked by AI recommendation score (quality + delivery speed)</p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 flex-wrap">
        <input
          required
          placeholder="Supplier name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]"
        />
        <input
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]"
        />
        <input
          type="number"
          placeholder="Avg delivery days"
          value={form.avgDeliveryDays}
          onChange={(e) => setForm({ ...form, avgDeliveryDays: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
        />
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Add Supplier
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Delivery Days</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-500">#{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.phone || "-"}</td>
                <td className="px-4 py-3">{s.avgDeliveryDays} days</td>
                <td className="px-4 py-3">{s.recommendationScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {suppliers.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No suppliers yet. Add your first one.</p>
        )}
      </div>
    </div>
  );
};