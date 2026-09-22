import { useEffect, useState, FormEvent } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";

interface Product {
  id: string;
  name: string;
  stockQuantity: number;
  minimumStock: number;
}

export const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"add" | "remove">("add");

  const loadAll = () => {
    api.get("/products").then((res) => setProducts(res.data));
    api.get("/inventory/low-stock").then((res) => setLowStock(res.data));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const quickAdjust = async (productId: string, delta: number) => {
    await api.post("/inventory/adjust", { productId, quantityDelta: delta, note: "Quick adjustment" });
    loadAll();
  };

  const openAdjustForm = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustQty("");
    setAdjustNote("");
    setAdjustDirection("add");
  };

  const submitAdjustment = async (e: FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustQty) return;

    const delta = adjustDirection === "add" ? Number(adjustQty) : -Number(adjustQty);

    await api.post("/inventory/adjust", {
      productId: adjustingProduct.id,
      quantityDelta: delta,
      note: adjustNote || undefined,
    });

    setAdjustingProduct(null);
    loadAll();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Inventory</h2>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-1">⚠ Low Stock Alert</p>
          <p className="text-sm text-amber-600">
            {lowStock.map((p) => p.name).join(", ")} {lowStock.length > 1 ? "are" : "is"} running low.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Current Stock</th>
              <th className="px-4 py-3">Minimum Stock</th>
              <th className="px-4 py-3">Quick Adjust</th>
              <th className="px-4 py-3">Custom Adjustment</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3">{p.stockQuantity}</td>
                <td className="px-4 py-3 text-gray-500">{p.minimumStock}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => quickAdjust(p.id, 1)}
                    className="px-2 py-1 text-xs bg-emerald-50 text-emerald-600 rounded"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => quickAdjust(p.id, -1)}
                    className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded"
                  >
                    -1
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openAdjustForm(p)}
                    className="text-xs text-brand-600 font-medium underline"
                  >
                    Adjust with note...
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Adjust Stock - {adjustingProduct.name}</h3>
              <button onClick={() => setAdjustingProduct(null)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Current stock: {adjustingProduct.stockQuantity} units</p>

            <form onSubmit={submitAdjustment} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustDirection("add")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    adjustDirection === "add"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Add Stock (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustDirection("remove")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    adjustDirection === "remove"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Remove Stock (-)
                </button>
              </div>

              <input
                required
                type="number"
                min="1"
                placeholder="Quantity"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />

              <input
                placeholder="Reason / note (e.g. damage recovery, physical count correction)"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />

              <button
                type="submit"
                className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700"
              >
                Confirm Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};