import { Router } from "express";
import {
  getCreditOverview,
  getCustomerLedger,
  recordPayment,
  updateCreditLimit,
} from "../controllers/credit.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/overview", asyncHandler(getCreditOverview));
router.get("/customer/:customerId", asyncHandler(getCustomerLedger));
router.post("/payment", asyncHandler(recordPayment));
router.put("/customer/:customerId/limit", requireRole(["OWNER", "MANAGER"]), asyncHandler(updateCreditLimit));

export default router;
