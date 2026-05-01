import { Router } from "express";
import { z } from "zod";
import { prisma } from "@farm-lease/db";
import type { Prisma } from "@prisma/client";
import { getRequestSession } from "../../lib/session";
import { dispatchNotification } from "./service";

const router = Router();

const notificationTestSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1).default("SYSTEM"),
  title: z.string().min(1),
  message: z.string().min(1),
  sendEmail: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.get("/", async (req, res) => {
  const session = await getRequestSession(req);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return res.json({ notifications, unreadCount });
});

router.patch("/:id/read", async (req, res) => {
  const session = await getRequestSession(req);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: session.user.id },
  });

  if (!notification) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true, readAt: new Date() },
  });

  return res.json(updated);
});

router.patch("/read-all", async (req, res) => {
  const session = await getRequestSession(req);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return res.status(204).send();
});

router.post("/test", async (req, res) => {
  const parsed = notificationTestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
  }

  const input = parsed.data;

  await dispatchNotification({
    type: input.type,
    recipients: [input.userId],
    title: input.title,
    message: input.message,
    sendEmail: input.sendEmail,
    metadata: input.metadata as Prisma.InputJsonValue | undefined,
  });

  return res.status(202).json({ ok: true });
});

export default router;
