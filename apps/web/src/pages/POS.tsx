import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../lib/api";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  gstRatePercent: number;
  stockQuantity: number;
}

interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  gstRatePercent: number;
  quantity: number;
}

// This is the "POS Mode" screen - quick billing at a shop counter.
// Search product, add to cart, hit checkout - creates a Sale via the API,
// which handles GST calculation and stock deduction on the backend.
interface Customer {
  id: string;
  name: string;
}

export const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING" | "PARTIAL">("PAID");
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/customers").then((res) => setCustomers(res.data));
  }, []);

  useEffect(() => {
    api.get("/products", { params: { search } }).then((res) => setProducts(res.data));
  }, [search]);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === p.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          unitPrice: Number(p.sellingPrice),
          gstRatePercent: Number(p.gstRatePercent),
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const gstTotal = cart.reduce(
    (sum, c) => sum + (c.unitPrice * c.quantity * c.gstRatePercent) / 100,
    0
  );
  const total = subtotal + gstTotal;

  const checkout = async () => {
    if (cart.length === 0) return;
    if (paymentStatus !== "PAID" && !customerId) {
      setMessage("Select a customer for a credit (Pending/Partial) sale.");
      return;
    }
    setMessage("");
    setLastSaleId(null);
    try {
      const res = await api.post("/sales", {
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        paymentStatus,
        customerId: customerId || undefined,
      });
      setMessage(`Sale recorded - Invoice ${res.data.invoiceNumber}`);
      setLastSaleId(res.data.id);
      setCart([]);
      setCustomerId("");
      setPaymentStatus("PAID");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Checkout failed");
    }
  };

  const downloadInvoice = async () => {
    if (!lastSaleId) return;
    const res = await api.get(`/sales/${lastSaleId}/invoice`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${lastSaleId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Sales - POS Mode</h2>
        <input
          placeholder="Search product to add..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stockQuantity === 0}
              className="text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-brand-400 disabled:opacity-40"
            >
              <p className="text-sm font-medium text-gray-800">{p.name}</p>
              <p className="text-xs text-gray-500">₹{p.sellingPrice} · {p.stockQuantity} in stock</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit sticky top-20">
        <h3 className="font-semibold text-gray-800 mb-3">Current Bill</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {cart.map((c) => (
            <div key={c.productId} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-800">{c.name}</p>
                <p className="text-gray-400 text-xs">
                  {c.quantity} × ₹{c.unitPrice} (+{c.gstRatePercent}% GST)
                </p>
              </div>
              <button onClick={() => removeFromCart(c.productId)}>
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          ))}
          {cart.length === 0 && <p className="text-gray-400 text-sm">Cart is empty</p>}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>GST</span>
            <span>₹{gstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-800 text-base">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Walk-in customer (no ledger)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as "PAID" | "PENDING" | "PARTIAL")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="PAID">Paid in full</option>
            <option value="PENDING">On credit (Pending)</option>
            <option value="PARTIAL">Partially paid</option>
          </select>
        </div>

        <button
          onClick={checkout}
          className="w-full mt-4 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700"
        >
          Checkout
        </button>

        {message && (
          <div className="mt-3 text-center space-y-2">
            <p className="text-xs text-gray-500">{message}</p>
            {lastSaleId && (
              <button
                onClick={downloadInvoice}
                className="text-xs text-brand-600 font-medium underline"
              >
                Download Invoice (PDF)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};