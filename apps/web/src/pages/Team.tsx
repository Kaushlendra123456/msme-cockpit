import { useEffect, useState, FormEvent } from "react";
import { UserPlus, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_PRIVILEGES: Record<string, string[]> = {
  OWNER: ["Everything — full access", "Business settings, backups, team management"],
  MANAGER: ["Products, Inventory, Purchases", "Sales (POS), Customers, Suppliers", "Set customer credit limits"],
  STAFF: ["Sales (POS)", "Inventory adjustments", "View dashboard & reports"],
};

export const Team = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" as "MANAGER" | "STAFF" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get("/auth/team").then((res) => setMembers(res.data));

  useEffect(() => {
    if (user?.role === "OWNER") load();
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/auth/staff", form);
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add team member");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (member: TeamMember) => {
    await api.put(`/auth/team/${member.id}/active`, { isActive: !member.isActive });
    load();
  };

  if (user?.role !== "OWNER") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-500 text-sm">Only the business Owner can manage team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Team & Roles</h2>
        <p className="text-sm text-gray-500">Add Managers or Staff and control what they can access</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        m.role === "OWNER"
                          ? "bg-brand-50 text-brand-700"
                          : m.role === "MANAGER"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={m.isActive ? "text-emerald-600 text-xs" : "text-red-500 text-xs"}>
                      {m.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.role !== "OWNER" && (
                      <button
                        onClick={() => toggleActive(m)}
                        className="text-xs text-gray-500 underline"
                      >
                        {m.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={16} className="text-brand-600" />
            <h3 className="font-semibold text-gray-800">Add Team Member</h3>
          </div>

          {error && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "MANAGER" | "STAFF" })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Member"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={14} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-600">What {form.role.toLowerCase()} can access:</p>
            </div>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              {ROLE_PRIVILEGES[form.role].map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};