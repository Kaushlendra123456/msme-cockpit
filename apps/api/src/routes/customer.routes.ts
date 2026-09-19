import { Router } from "express";
import { listCustomers, createCustomer, getCustomerInsights } from "../controllers/customer.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/", asyncHandler(listCustomers));
router.post("/", asyncHandler(createCustomer));
router.get("/insights", asyncHandler(getCustomerInsights));

export default router;
