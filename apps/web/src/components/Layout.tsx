import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export const Layout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <Navbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
