import { Router } from "express";
import { createPurchase, listPurchases } from "../controllers/purchase.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.post("/", requireRole(["OWNER", "MANAGER"]), asyncHandler(createPurchase));
router.get("/", asyncHandler(listPurchases));

export default router;
