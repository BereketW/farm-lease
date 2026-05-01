import { Router } from "express";
import { z } from "zod";
import { prisma } from "@farm-lease/db";
import { Role, UserStatus } from "@prisma/client";
import { getRequestSession } from "../../lib/session";

const router = Router();

const setupProfileSchema = z.object({
  role: z.nativeEnum(Role),
});

/** Called right after registration to set the user's role and create their profile. */
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
      data: { role, status: UserStatus.ACTIVE },
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
