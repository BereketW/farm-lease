import { Router } from "express";
import { z } from "zod";
import { prisma } from "@farm-lease/db";
import { Role, UserStatus } from "@prisma/client";
import { requireRole, requireSession } from "../../lib/auth";
import { getRequestSession } from "../../lib/session";
import { logAudit } from "../../lib/audit";

const router = Router();

// ---------- ADMIN USER MANAGEMENT ----------

router.get("/", requireSession, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        sessions: {
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const withLastLogin = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.sessions[0]?.updatedAt ?? null,
    }));

    return res.json({ users: withLastLogin });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", requireSession, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const parsed = z.object({ status: z.nativeEnum(UserStatus) }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const actor = req.user!;
    if (actor.id === req.params.id && parsed.data.status === UserStatus.SUSPENDED) {
      return res.status(400).json({ error: "CANNOT_SUSPEND_SELF" });
    }

    const current = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true },
    });
    if (!current) return res.status(404).json({ error: "NOT_FOUND" });

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });

    logAudit({
      actorId: actor.id,
      action: "STATE_CHANGE",
      targetType: "User",
      targetId: updatedUser.id,
      details: {
        field: "status",
        from: current.status,
        to: updatedUser.status,
      },
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/role", requireSession, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const parsed = z.object({ role: z.nativeEnum(Role) }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const actor = req.user!;
    if (actor.id === req.params.id) {
      return res.status(400).json({ error: "CANNOT_CHANGE_OWN_ROLE" });
    }

    const current = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true },
    });
    if (!current) return res.status(404).json({ error: "NOT_FOUND" });

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: parsed.data.role },
    });

    logAudit({
      actorId: actor.id,
      action: "UPDATE",
      targetType: "User",
      targetId: updatedUser.id,
      details: {
        field: "role",
        from: current.role,
        to: updatedUser.role,
      },
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/promote-admin", requireSession, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const actor = req.user!;
    if (actor.id === req.params.id) {
      return res.status(400).json({ error: "ALREADY_SELF_ADMIN" });
    }

    const current = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true },
    });
    if (!current) return res.status(404).json({ error: "NOT_FOUND" });
    if (current.role === Role.ADMIN) {
      return res.status(409).json({ error: "ALREADY_ADMIN" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: Role.ADMIN },
    });

    logAudit({
      actorId: actor.id,
      action: "UPDATE",
      targetType: "User",
      targetId: updatedUser.id,
      details: {
        field: "role",
        from: current.role,
        to: Role.ADMIN,
        reason: "promote_admin",
      },
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/audit", requireSession, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const parsed = z
      .object({ take: z.coerce.number().int().min(1).max(200).optional() })
      .safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_QUERY", issues: parsed.error.issues });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!user) return res.status(404).json({ error: "NOT_FOUND" });

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [{ actorId: req.params.id }, { targetType: "User", targetId: req.params.id }],
      },
      orderBy: { createdAt: "desc" },
      take: parsed.data.take ?? 100,
      include: {
        actor: { select: { id: true, name: true, role: true, email: true } },
      },
    });

    return res.json({ logs });
  } catch (error) {
    next(error);
  }
});

// ---------- SETUP PROFILE ----------

const setupProfileSchema = z.object({
  role: z.enum([Role.INVESTOR, Role.FARMER, Role.REPRESENTATIVE]),
});

router.post("/setup-profile", async (req, res, next) => {
  try {
    const session = await getRequestSession(req);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    const parsed = setupProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const { role } = parsed.data;
    const userId = session.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { role, status: UserStatus.PENDING }, // Must be PENDING per logic rules
    });

    switch (role) {
      case Role.INVESTOR:
        await prisma.investorProfile.upsert({
          where: { userId },
          update: {},
          create: { userId, preferredRegions: [], preferredCrops: [] },
        });
        break;
      case Role.FARMER:
        await prisma.farmerProfile.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });
        break;
      case Role.REPRESENTATIVE:
        await prisma.representativeProfile.upsert({
          where: { userId },
          update: {},
          create: { userId, permissions: [] },
        });
        break;
      default:
        break;
    }

    return res.json({ ok: true, role });
  } catch (error) {
    next(error);
  }
});

/** Returns the current user's profile. */
router.get("/me", async (req, res, next) => {
  try {
    const session = await getRequestSession(req);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        investorProfile: true,
        farmerProfile: true,
        representativeProfile: true,
      },
    });

    if (!user) return res.status(404).json({ error: "NOT_FOUND" });
    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
