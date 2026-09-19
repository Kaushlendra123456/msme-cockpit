import { Router } from "express";
import { getBusinessProfile, updateBusinessProfile } from "../controllers/business.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/", asyncHandler(getBusinessProfile));
router.put("/", requireRole(["OWNER"]), asyncHandler(updateBusinessProfile));

export default router;
