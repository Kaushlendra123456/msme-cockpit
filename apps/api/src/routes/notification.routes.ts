import { Router } from "express";
import { listNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/", asyncHandler(listNotifications));
router.put("/:id/read", asyncHandler(markAsRead));
router.put("/read-all", asyncHandler(markAllAsRead));

export default router;
