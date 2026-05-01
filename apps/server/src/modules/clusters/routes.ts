import { Router } from "express";
import { z } from "zod";
import { prisma } from "@farm-lease/db";
import { Prisma } from "@prisma/client";
import { requireSession } from "../../lib/auth";

const router = Router();

// Coerce so `?minSize=10` strings from query-strings are parsed as numbers.
const listQuerySchema = z.object({
  region: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  cropType: z.string().min(1).optional(),
  minSize: z.coerce.number().min(0).optional(),
  maxSize: z.coerce.number().min(0).optional(),
});

router.get("/", requireSession, async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_QUERY", issues: parsed.error.issues });
    }
    const { region, search, cropType, minSize, maxSize } = parsed.data;

    const sizeFilter: Prisma.DecimalFilter | undefined =
      minSize !== undefined || maxSize !== undefined
        ? {
            ...(minSize !== undefined ? { gte: new Prisma.Decimal(minSize) } : {}),
            ...(maxSize !== undefined ? { lte: new Prisma.Decimal(maxSize) } : {}),
          }
        : undefined;

    const clusters = await prisma.cluster.findMany({
      where: {
        region: region ?? undefined,
        cropTypes: cropType ? { has: cropType } : undefined,
        totalArea: sizeFilter,
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        representatives: {
          where: { isPrimary: true },
          include: { user: { select: { id: true, name: true, email: true } } },
          take: 1,
        },
        _count: { select: { farmers: true, proposals: true } },
      },
      orderBy: { registeredAt: "desc" },
      take: 100,
    });

    return res.json({ clusters });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireSession, async (req, res, next) => {
  try {
    const cluster = await prisma.cluster.findUnique({
      where: { id: req.params.id },
      include: {
        representatives: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        farmers: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
        _count: { select: { proposals: true } },
      },
    });
    if (!cluster) return res.status(404).json({ error: "NOT_FOUND" });
    return res.json({ cluster });
  } catch (error) {
    next(error);
  }
});

export default router;
