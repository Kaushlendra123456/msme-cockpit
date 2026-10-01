import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/email.service";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/hash";
import { signToken } from "../utils/jwt";

const registerSchema = z.object({
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const { businessName, ownerName, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: { name: businessName },
    });
    const user = await tx.user.create({
      data: {
        businessId: business.id,
        name: ownerName,
        email,
        passwordHash,
        role: "OWNER",
        phone,
      },
    });
    return { business, user };
  });

  const token = signToken({
    userId: result.user.id,
    businessId: result.business.id,
    role: "OWNER",
  });

  res.status(201).json({
    token,
    user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role },
    business: { id: result.business.id, name: result.business.name },
  });
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
  });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

const addStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["MANAGER", "STAFF"]),
  phone: z.string().optional(),
});

export const addStaffMember = async (req: Request, res: Response) => {
  const parsed = addStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }
  const { name, email, password, role, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      businessId: req.user!.businessId,
      name,
      email,
      passwordHash,
      role,
      phone,
    },
  });

  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { business: true },
  });
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    business: { id: user.business.id, name: user.business.name, currency: user.business.currency },
  });
};

export const listTeamMembers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { businessId: req.user!.businessId },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
};

const toggleActiveSchema = z.object({
  isActive: z.boolean(),
});

export const setTeamMemberActive = async (req: Request, res: Response) => {
  const parsed = toggleActiveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const target = await prisma.user.findFirst({
    where: { id: req.params.userId, businessId: req.user!.businessId },
  });
  if (!target) return res.status(404).json({ message: "User not found" });
  if (target.role === "OWNER") {
    return res.status(400).json({ message: "Cannot deactivate the business owner" });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.userId },
    data: { isActive: parsed.data.isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  res.json(updated);
};

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const forgotPassword = async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return a generic success message, even if the email doesn't
  // exist — this prevents attackers from using this endpoint to discover
  // which emails are registered (a common security best practice).
  const genericResponse = {
    message: "If an account exists with that email, a reset link has been sent.",
  };

  if (!user) {
    return res.json(genericResponse);
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink);
  } catch (err) {
    // Don't leak email-sending failures to the client — log server-side only
    console.error("Failed to send password reset email:", err);
  }

  res.json(genericResponse);
};

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

export const resetPassword = async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const { token, newPassword } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } }),
  ]);

  res.json({ message: "Password reset successfully. You can now log in with your new password." });
};