import { Router } from "express";
import {
  getReorderSuggestions,
  getHealthScore,
  getHealthScoreHistory,
  getCashFlowForecastHandler,
} from "../controllers/intelligence.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/reorder-suggestions", asyncHandler(getReorderSuggestions));
router.get("/health-score", asyncHandler(getHealthScore));
router.get("/health-score/history", asyncHandler(getHealthScoreHistory));
router.get("/cash-flow-forecast", asyncHandler(getCashFlowForecastHandler));

export default router;
