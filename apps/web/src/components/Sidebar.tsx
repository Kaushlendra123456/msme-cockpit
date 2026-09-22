import { useState, useRef, useEffect } from "react";
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
  X,
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

const MIN_WIDTH = 80;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 256;
const COLLAPSE_THRESHOLD = 110;

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar = ({ mobileOpen, onCloseMobile }: SidebarProps) => {
  const { user } = useAuth();
  const canManagePurchases = user?.role === "OWNER" || user?.role === "MANAGER";

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isLgUp, setIsLgUp] = useState(typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
  const isDraggingRef = useRef(false);
  const collapsed = isLgUp && width <= COLLAPSE_THRESHOLD;

  useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startDrag = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const handleDoubleClick = () => {
    setWidth((w) => (w <= COLLAPSE_THRESHOLD ? DEFAULT_WIDTH : MIN_WIDTH));
  };

  // Every nav click closes the mobile drawer automatically — harmless on
  // desktop since the drawer/overlay only render visually below the lg breakpoint.
  const handleNavClick = () => onCloseMobile();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        style={isLgUp ? { width } : undefined}
        className={`
          bg-white border-r border-gray-200 h-screen flex flex-col z-40
          fixed lg:sticky top-0
          ${!isLgUp ? "w-64" : ""}
          ${mobileOpen ? "left-0" : "-left-64 lg:left-0"}
          ${isDraggingRef.current ? "" : "transition-all duration-150"}
        `}
      >
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-brand-700 truncate">MSME Cockpit</h1>
              <p className="text-xs text-gray-400 truncate">AI Operating System</p>
            </div>
          )}
          {collapsed && <span className="text-lg font-bold text-brand-700 mx-auto">M</span>}

          <button onClick={onCloseMobile} className="lg:hidden text-gray-400 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={handleNavClick}
              className={navLinkClass}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          {canManagePurchases && (
            <NavLink to="/purchases" onClick={handleNavClick} className={navLinkClass} title={collapsed ? "Purchases" : undefined}>
              <ShoppingBag size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">Purchases</span>}
            </NavLink>
          )}

          {user?.role === "OWNER" && (
            <NavLink to="/team" onClick={handleNavClick} className={navLinkClass} title={collapsed ? "Team & Roles" : undefined}>
              <UsersRound size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">Team & Roles</span>}
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <NavLink to="/settings" onClick={handleNavClick} className={navLinkClass} title={collapsed ? "Settings" : undefined}>
            <Settings size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">Settings</span>}
          </NavLink>
        </div>

        {/* Drag handle — desktop only. Double-click snaps between full and collapsed width. */}
        <div
          onMouseDown={startDrag}
          onDoubleClick={handleDoubleClick}
          className="hidden lg:block absolute top-0 right-0 h-full w-1.5 cursor-ew-resize hover:bg-brand-300 active:bg-brand-400"
          title="Drag to resize, double-click to toggle"
        />
      </aside>
    </>
  );
};