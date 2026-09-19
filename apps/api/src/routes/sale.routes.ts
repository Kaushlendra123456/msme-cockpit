import { Router } from "express";
import { createSale, listSales, getSale, getCustomerHistory, downloadInvoice } from "../controllers/sale.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.post("/", asyncHandler(createSale));
router.get("/", asyncHandler(listSales));
router.get("/:id", asyncHandler(getSale));
router.get("/customer/:customerId/history", asyncHandler(getCustomerHistory));
router.get("/:id/invoice", asyncHandler(downloadInvoice));

export default router;