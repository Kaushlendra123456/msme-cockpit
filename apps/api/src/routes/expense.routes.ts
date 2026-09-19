import { Router } from "express";
import { createExpense, listExpenses, expenseReport } from "../controllers/expense.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.post("/", requireRole(["OWNER", "MANAGER"]), asyncHandler(createExpense));
router.get("/", asyncHandler(listExpenses));
router.get("/report", asyncHandler(expenseReport));

export default router;