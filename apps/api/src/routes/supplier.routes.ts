import { Router } from "express";
import { listSuppliers, createSupplier, getRecommendedSuppliers } from "../controllers/supplier.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/", asyncHandler(listSuppliers));
router.post("/", asyncHandler(createSupplier));
router.get("/recommended", asyncHandler(getRecommendedSuppliers));

export default router;
