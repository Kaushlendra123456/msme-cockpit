import { Router } from "express";
import { exportSales, exportProducts, exportCustomers, exportExpenses } from "../controllers/export.controller";
import { triggerBackup } from "../controllers/backup.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/sales", asyncHandler(exportSales));
router.get("/products", asyncHandler(exportProducts));
router.get("/customers", asyncHandler(exportCustomers));
router.get("/expenses", asyncHandler(exportExpenses));
router.get("/backup", requireRole(["OWNER"]), asyncHandler(triggerBackup));

export default router;
