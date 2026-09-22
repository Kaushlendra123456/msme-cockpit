import { useEffect, useState, FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { api } from "../lib/api";

interface CreditCustomer {
  id: string;
  name: string;
  phone?: string;
  creditLimit: number;
  outstandingCredit: number;
  lastPurchaseAt?: string;
  isOverdue: boolean;
}

interface LedgerEntry {
  id: string;
  type: "SALE_ON_CREDIT" | "PAYMENT_RECEIVED" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

// The Customer Credit Ledger screen - tracks "udhaar" given to customers
// and payments received against it. This is a mandatory module per the
// capstone brief and was missing from the earlier build.
export const Credit = () => {
  const [customers, setCustomers] = useState<CreditCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");

  const loadOverview = () => api.get("/credit/overview").then((res) => setCustomers(res.data));

  useEffect(() => {
    loadOverview();
  }, []);

  const openCustomer = async (customer: CreditCustomer) => {
    setSelectedCustomer(customer);
    const res = await api.get(`/credit/customer/${customer.id}`);
    setLedger(res.data);
  };

  const recordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) return;
    await api.post("/credit/payment", {
      customerId: selectedCustomer.id,
      amount: Number(paymentAmount),
    });
    setPaymentAmount("");
    await loadOverview();
    const res = await api.get(`/credit/customer/${selectedCustomer.id}`);
    setLedger(res.data);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Customer Credit Ledger</h2>
          <p className="text-sm text-gray-500">Track outstanding "udhaar" and payments received</p>
        </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3">Limit</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openCustomer(c)}
                  className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedCustomer?.id === c.id ? "bg-brand-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3">₹{Number(c.outstandingCredit).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-500">₹{Number(c.creditLimit).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    {c.isOverdue && (
                      <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                        <AlertCircle size={12} /> Overdue
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          {customers.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">
              No outstanding credit right now. Credit sales appear here automatically when a
              sale is recorded with "Pending" or "Partial" payment status.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit sticky top-20">
        {!selectedCustomer ? (
          <p className="text-sm text-gray-400">Select a customer to see their ledger history.</p>
        ) : (
          <>
            <h3 className="font-semibold text-gray-800 mb-1">{selectedCustomer.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Outstanding: ₹{Number(selectedCustomer.outstandingCredit).toLocaleString("en-IN")}
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
              {ledger.map((entry) => (
                <div key={entry.id} className="flex justify-between text-xs border-b border-gray-50 pb-2">
                  <div>
                    <p
                      className={
                        entry.type === "PAYMENT_RECEIVED" ? "text-emerald-600" : "text-gray-700"
                      }
                    >
                      {entry.type === "SALE_ON_CREDIT" ? "Credit Sale" : entry.type === "PAYMENT_RECEIVED" ? "Payment Received" : "Adjustment"}
                    </p>
                    <p className="text-gray-400">{new Date(entry.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <p className={entry.type === "PAYMENT_RECEIVED" ? "text-emerald-600" : "text-gray-800"}>
                    {entry.type === "PAYMENT_RECEIVED" ? "-" : "+"}₹{Number(entry.amount).toFixed(2)}
                  </p>
                </div>
              ))}
              {ledger.length === 0 && <p className="text-xs text-gray-400">No ledger entries yet.</p>}
            </div>

            <form onSubmit={recordPayment} className="flex gap-2">
              <input
                type="number"
                placeholder="Amount received"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
              >
                Record
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
