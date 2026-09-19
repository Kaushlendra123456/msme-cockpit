import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const listNotifications = async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { businessId: req.user!.businessId, isRead: false },
  });
  res.json({ notifications, unreadCount });
};

export const markAsRead = async (req: Request, res: Response) => {
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!notification) return res.status(404).json({ message: "Notification not found" });

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json(updated);
};

export const markAllAsRead = async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { businessId: req.user!.businessId, isRead: false },
    data: { isRead: true },
  });
  res.json({ message: "All notifications marked as read" });
};
