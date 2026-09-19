import { Router } from "express";
import { getProductHistory, getLowStock, adjustStock } from "../controllers/inventory.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/low-stock", asyncHandler(getLowStock));
router.get("/:productId/history", asyncHandler(getProductHistory));
router.post("/adjust", asyncHandler(adjustStock));

export default router;
