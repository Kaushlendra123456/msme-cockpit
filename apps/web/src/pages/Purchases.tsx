import { useEffect, useState } from "react";
import { Trash2, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";

interface Product {
  id: string;
  name: string;
  purchasePrice: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseItemLine {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseRecord {
  id: string;
  poNumber: string;
  totalAmount: number;
  status: string;
  purchaseDate: string;
  supplier?: { name: string } | null;
  items: { quantity: number }[];
}

// Purchase order entry - Owner/Manager only (enforced by backend too).
// Selecting a product and adding it here creates a purchase order that,
// on submit, automatically increases stock (handled server-side).
export const Purchases = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItemLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [message, setMessage] = useState("");

  const loadPurchases = () => api.get("/purchases").then((res) => setPurchases(res.data));

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
    api.get("/suppliers").then((res) => setSuppliers(res.data));
    loadPurchases();
  }, []);

  const addItem = () => {
    if (!selectedProductId || !unitCost) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    setItems((prev) => [
      ...prev,
      { productId: product.id, name: product.name, quantity: Number(quantity), unitCost: Number(unitCost) },
    ]);
    setSelectedProductId("");
    setQuantity("1");
    setUnitCost("");
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const submitPurchase = async () => {
    if (items.length === 0) return;
    setMessage("");
    try {
      await api.post("/purchases", {
        supplierId: supplierId || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
      });
      setMessage("Purchase order recorded - stock updated.");
      setItems([]);
      setSupplierId("");
      loadPurchases();
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to record purchase");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingBag size={20} className="text-brand-600" />
        <h2 className="text-xl font-bold text-gray-800">Purchases</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">New Purchase Order</p>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">No supplier (walk-in purchase)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="sm:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Unit cost"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={addItem}
              className="text-sm text-brand-600 font-medium underline"
            >
              + Add item to order
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Order Items</p>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400">No items added yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((i) => (
                  <div key={i.productId} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                    <div>
                      <p className="text-gray-800">{i.name}</p>
                      <p className="text-gray-400 text-xs">
                        {i.quantity} × ₹{i.unitCost} = ₹{(i.quantity * i.unitCost).toFixed(2)}
                      </p>
                    </div>
                    <button onClick={() => removeItem(i.productId)}>
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-gray-800 pt-2">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            )}
            <button
              onClick={submitPurchase}
              disabled={items.length === 0}
              className="w-full mt-4 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              Record Purchase (Stock will increase)
            </button>
            {message && <p className="text-xs text-center mt-3 text-gray-500">{message}</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-fit">
          <p className="text-sm font-semibold text-gray-700 px-4 py-3 border-b border-gray-100">
            Purchase History
          </p>
          <div className="max-h-96 overflow-y-auto">
            {purchases.map((p) => (
              <div key={p.id} className="px-4 py-3 border-b border-gray-50 text-sm">
                <p className="font-medium text-gray-800">{p.poNumber}</p>
                <p className="text-xs text-gray-500">
                  {p.supplier?.name || "No supplier"} · {p.items.length} item(s)
                </p>
                <p className="text-xs text-gray-400">{new Date(p.purchaseDate).toLocaleDateString("en-IN")}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">₹{Number(p.totalAmount).toFixed(2)}</p>
              </div>
            ))}
            {purchases.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No purchases yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};