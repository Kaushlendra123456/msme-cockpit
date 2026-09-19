import { Router } from "express";
import { register, login, addStaffMember, getMe, listTeamMembers, setTeamMemberActive } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", authMiddleware, asyncHandler(getMe));
router.post("/staff", authMiddleware, requireRole(["OWNER"]), asyncHandler(addStaffMember));
router.get("/team", authMiddleware, requireRole(["OWNER"]), asyncHandler(listTeamMembers));
router.put("/team/:userId/active", authMiddleware, requireRole(["OWNER"]), asyncHandler(setTeamMemberActive));

export default router;