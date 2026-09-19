import { Router } from "express";
import { getFinanceOverview, getRevenueTrend, getTopProductThisWeek } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/overview", asyncHandler(getFinanceOverview));
router.get("/revenue-trend", asyncHandler(getRevenueTrend));
router.get("/top-product-week", asyncHandler(getTopProductThisWeek));

export default router;