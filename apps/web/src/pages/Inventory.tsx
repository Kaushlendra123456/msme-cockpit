import { useEffect, useState } from "react";
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

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
    api.get("/inventory/low-stock").then((res) => setLowStock(res.data));
  }, []);

  const adjustStock = async (productId: string, delta: number) => {
    await api.post("/inventory/adjust", { productId, quantityDelta: delta, note: "Manual adjustment" });
    api.get("/products").then((res) => setProducts(res.data));
    api.get("/inventory/low-stock").then((res) => setLowStock(res.data));
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
              <th className="px-4 py-3">Adjust</th>
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
                    onClick={() => adjustStock(p.id, 1)}
                    className="px-2 py-1 text-xs bg-emerald-50 text-emerald-600 rounded"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => adjustStock(p.id, -1)}
                    className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded"
                  >
                    -1
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
