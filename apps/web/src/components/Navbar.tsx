import { useEffect, useState, useRef } from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar = ({ onOpenMobileMenu }: NavbarProps) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    api.get("/notifications").then((res) => {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    });
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    loadNotifications();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button onClick={onOpenMobileMenu} className="lg:hidden text-gray-500 flex-shrink-0">
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Welcome back,</p>
          <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{user?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-full hover:bg-gray-100 relative"
          >
            <Bell size={20} className="text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-600 font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 text-sm ${
                      !n.isRead ? "bg-brand-50/50" : ""
                    }`}
                  >
                    <p className="font-medium text-gray-800">{n.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                    <p className="text-gray-300 text-[10px] mt-1">
                      {new Date(n.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="text-xs">
            <p className="font-medium text-gray-700">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};