import { useEffect, useState, FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Product {
  id: string;
  name: string;
  sku?: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRatePercent: number;
  stockQuantity: number;
  minimumStock: number;
}

export const Products = () => {
  const { user } = useAuth();
  const canManageProducts = user?.role === "OWNER" || user?.role === "MANAGER";
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    purchasePrice: "",
    sellingPrice: "",
    gstRatePercent: "18",
    stockQuantity: "0",
    minimumStock: "5",
  });

  const loadProducts = () => api.get("/products").then((res) => setProducts(res.data));

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/products", {
      name: form.name,
      sku: form.sku || undefined,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      gstRatePercent: Number(form.gstRatePercent),
      stockQuantity: Number(form.stockQuantity),
      minimumStock: Number(form.minimumStock),
    });
    setShowForm(false);
    setForm({ name: "", sku: "", purchasePrice: "", sellingPrice: "", gstRatePercent: "18", stockQuantity: "0", minimumStock: "5" });
    loadProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Products</h2>
          <p className="text-sm text-gray-500">Manage your product catalog</p>
        </div>
        {canManageProducts && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Purchase Price</th>
              <th className="px-4 py-3">Selling Price</th>
              <th className="px-4 py-3">GST %</th>
              <th className="px-4 py-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.sku || "-"}</td>
                <td className="px-4 py-3">₹{p.purchasePrice}</td>
                <td className="px-4 py-3">₹{p.sellingPrice}</td>
                <td className="px-4 py-3">{p.gstRatePercent}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.stockQuantity <= p.minimumStock
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {p.stockQuantity} units
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {products.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No products yet. Add your first one.</p>
        )}
      </div>
      
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Add Product</h3>
              <button onClick={() => setShowForm(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="SKU (optional)"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  placeholder="Purchase price"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  required
                  type="number"
                  placeholder="Selling price"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="GST %"
                  value={form.gstRatePercent}
                  onChange={(e) => setForm({ ...form, gstRatePercent: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Opening stock"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Min stock"
                  value={form.minimumStock}
                  onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};