import { Router } from "express";
import { createPaymentOrder } from "../controllers/payment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.post("/create-order", asyncHandler(createPaymentOrder));

export default router;
