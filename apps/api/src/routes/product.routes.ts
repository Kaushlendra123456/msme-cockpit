import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/", asyncHandler(listProducts));
router.get("/:id", asyncHandler(getProduct));
router.post("/", requireRole(["OWNER", "MANAGER"]), asyncHandler(createProduct));
router.put("/:id", requireRole(["OWNER", "MANAGER"]), asyncHandler(updateProduct));
router.delete("/:id", requireRole(["OWNER", "MANAGER"]), asyncHandler(deleteProduct));

export default router;
