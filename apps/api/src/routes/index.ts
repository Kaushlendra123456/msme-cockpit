import { Router } from "express";
import authRoutes from "./auth.routes";
import businessRoutes from "./business.routes";
import productRoutes from "./product.routes";
import inventoryRoutes from "./inventory.routes";
import saleRoutes from "./sale.routes";
import purchaseRoutes from "./purchase.routes";
import expenseRoutes from "./expense.routes";
import customerRoutes from "./customer.routes";
import supplierRoutes from "./supplier.routes";
import dashboardRoutes from "./dashboard.routes";
import intelligenceRoutes from "./intelligence.routes";
import paymentRoutes from "./payment.routes";
import creditRoutes from "./credit.routes";
import notificationRoutes from "./notification.routes";
import exportRoutes from "./export.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/business", businessRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", saleRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/expenses", expenseRoutes);
router.use("/customers", customerRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/intelligence", intelligenceRoutes);
router.use("/payments", paymentRoutes);
router.use("/credit", creditRoutes);
router.use("/notifications", notificationRoutes);
router.use("/export", exportRoutes);

export default router;
