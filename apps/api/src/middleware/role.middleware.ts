import { Request, Response, NextFunction } from "express";

// Usage: router.post('/products', authMiddleware, requireRole(['OWNER','MANAGER']), handler)
export const requireRole =
  (allowedRoles: Array<"OWNER" | "MANAGER" | "STAFF">) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You don't have permission for this action" });
    }
    next();
  };
