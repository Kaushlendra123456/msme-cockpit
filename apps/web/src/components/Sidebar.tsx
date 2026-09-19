import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  Wallet,
  Sparkles,
  FileBarChart,
  Settings,
  Receipt,
  UsersRound,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "Sales (POS)", icon: ShoppingCart },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/credit", label: "Credit Ledger", icon: Receipt },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/expenses", label: "Finance", icon: Wallet },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/reports", label: "Reports", icon: FileBarChart },
];

export const Sidebar = () => {
  const { user } = useAuth();
  const canManagePurchases = user?.role === "OWNER" || user?.role === "MANAGER";

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <h1 className="text-lg font-bold text-brand-700">MSME Cockpit</h1>
        <p className="text-xs text-gray-400">AI Operating System</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {canManagePurchases && (
          <NavLink
            to="/purchases"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <ShoppingBag size={18} />
            Purchases
          </NavLink>
        )}

        {user?.role === "OWNER" && (
          <NavLink
            to="/team"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <UsersRound size={18} />
            Team & Roles
          </NavLink>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};