import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { POS } from "./pages/POS";
import { Inventory } from "./pages/Inventory";
import { Customers } from "./pages/Customers";
import { Suppliers } from "./pages/Suppliers";
import { Credit } from "./pages/Credit";
import { Expenses } from "./pages/Expenses";
import { Insights } from "./pages/Insights";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Team } from "./pages/Team";
import { Purchases } from "./pages/Purchases";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-gray-400 text-sm">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Dashboard />} />
      <Route path="/pos" element={<POS />} />
      <Route path="/products" element={<Products />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/credit" element={<Credit />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/team" element={<Team />} />
      <Route path="/purchases" element={<Purchases />} />
    </Route>
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
