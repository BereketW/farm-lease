import { Router } from "express";
import { z } from "zod";
import { prisma } from "@farm-lease/db";
import { ClusterStatus, Prisma, Role } from "@prisma/client";
import { requireActive, requireRole, requireSession } from "../../lib/auth";
import { documentUpload, fileToPublicUrl } from "../../lib/storage";
import { logAudit } from "../../lib/audit";

const router = Router();
router.use(requireSession);

// Coerce so `?minSize=10` strings from query-strings are parsed as numbers.
const listQuerySchema = z.object({
  region: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  cropType: z.string().min(1).optional(),
  minSize: z.coerce.number().min(0).optional(),
  maxSize: z.coerce.number().min(0).optional(),
});

router.get("/", async (req, res, next) => {
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

    const actor = req.user!;
    const visibilityFilter: Prisma.ClusterWhereInput =
      actor.role === Role.ADMIN
        ? {}
        : actor.role === Role.INVESTOR
          ? { status: ClusterStatus.VERIFIED }
          : {
              OR: [
                { status: ClusterStatus.VERIFIED },
                { representatives: { some: { userId: actor.id } } },
                { farmers: { some: { userId: actor.id } } },
              ],
            };

    const clusters = await prisma.cluster.findMany({
      where: {
        ...visibilityFilter,
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

// ---------- REGISTER CLUSTER ----------

const registerSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().min(3),
  region: z.string().min(2),
  totalArea: z.coerce.number().positive(),
  cropTypes: z.array(z.string()).min(1),
  geodata: z.string(), // JSON string
  coordinates: z.string(), // JSON string
  farmers: z.array(z.object({ userId: z.string(), landShare: z.coerce.number().positive() })).min(1),
});

router.post(
  "/",
  requireActive,
  requireRole(Role.FARMER, Role.REPRESENTATIVE),
  documentUpload.array("documents", 5),
  async (req, res, next) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
      }

      const files = req.files as Express.Multer.File[];
      const documents = files.map((f) => fileToPublicUrl("documents", f.filename));

      const { farmers, geodata, coordinates, ...clusterData } = parsed.data;

      const cluster = await prisma.$transaction(async (tx) => {
        const newCluster = await tx.cluster.create({
          data: {
            ...clusterData,
            totalArea: new Prisma.Decimal(clusterData.totalArea),
            geodata: JSON.parse(geodata),
            coordinates: JSON.parse(coordinates),
            documents,
            status: ClusterStatus.PENDING,
          },
        });

        // Add creator as primary representative
        await tx.clusterRepresentative.create({
          data: {
            clusterId: newCluster.id,
            userId: req.user!.id,
            isPrimary: true,
          },
        });

        // Add specified farmers
        await tx.clusterFarmer.createMany({
          data: farmers.map((f) => ({
            clusterId: newCluster.id,
            userId: f.userId,
            landShare: new Prisma.Decimal(f.landShare),
          })),
        });

        return newCluster;
      });

      logAudit({
        actorId: req.user!.id,
        action: "CREATE",
        targetType: "Cluster",
        targetId: cluster.id,
        details: { name: cluster.name },
      });

      return res.status(201).json({ cluster });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/:id", async (req, res, next) => {
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

    const actor = req.user!;
    if (
      cluster.status !== ClusterStatus.VERIFIED &&
      actor.role !== Role.ADMIN &&
      !cluster.representatives.some((r) => r.userId === actor.id) &&
      !cluster.farmers.some((f) => f.userId === actor.id)
    ) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    return res.json({ cluster });
  } catch (error) {
    next(error);
  }
});

// ---------- ADMIN VERIFICATION ----------

const decisionSchema = z.object({
  decision: z.enum(["VERIFY", "REJECT"]),
  reason: z.string().max(500).optional(),
});

router.post("/:id/decision", requireActive, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const cluster = await prisma.cluster.findUnique({
      where: { id: req.params.id },
    });
    if (!cluster) return res.status(404).json({ error: "NOT_FOUND" });

    if (cluster.status !== ClusterStatus.PENDING) {
      return res.status(409).json({ error: "INVALID_STATE", status: cluster.status });
    }

    const isVerify = parsed.data.decision === "VERIFY";
    
    const updated = await prisma.cluster.update({
      where: { id: cluster.id },
      data: {
        status: isVerify ? ClusterStatus.VERIFIED : ClusterStatus.REJECTED,
      },
    });

    logAudit({
      actorId: req.user!.id,
      action: isVerify ? "VERIFY" : "REJECT",
      targetType: "Cluster",
      targetId: cluster.id,
      details: { reason: parsed.data.reason },
    });

    return res.json({ cluster: updated });
  } catch (error) {
    next(error);
  }
});

// ---------- CLUSTER MANAGEMENT ----------

const updateClusterSchema = z.object({
  description: z.string().max(2000).optional(),
  cropTypes: z.array(z.string()).min(1).optional(),
});

router.patch("/:id", requireActive, requireRole(Role.REPRESENTATIVE), async (req, res, next) => {
  try {
    const parsed = updateClusterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const cluster = await prisma.cluster.findUnique({
      where: { id: req.params.id },
      include: { representatives: true },
    });
    if (!cluster) return res.status(404).json({ error: "NOT_FOUND" });

    const isRep = cluster.representatives.some((r) => r.userId === req.user!.id);
    if (!isRep) return res.status(403).json({ error: "FORBIDDEN" });

    const updated = await prisma.cluster.update({
      where: { id: cluster.id },
      data: parsed.data,
    });

    logAudit({
      actorId: req.user!.id,
      action: "UPDATE",
      targetType: "Cluster",
      targetId: cluster.id,
    });

    return res.json({ cluster: updated });
  } catch (error) {
    next(error);
  }
});

const addFarmerSchema = z.object({
  userId: z.string().min(1),
  landShare: z.coerce.number().positive(),
});

router.post("/:id/farmers", requireActive, requireRole(Role.REPRESENTATIVE), async (req, res, next) => {
  try {
    const parsed = addFarmerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const cluster = await prisma.cluster.findUnique({
      where: { id: req.params.id },
      include: { representatives: true },
    });
    if (!cluster) return res.status(404).json({ error: "NOT_FOUND" });

    const isRep = cluster.representatives.some((r) => r.userId === req.user!.id);
    if (!isRep) return res.status(403).json({ error: "FORBIDDEN" });

    const farmer = await prisma.clusterFarmer.create({
      data: {
        clusterId: cluster.id,
        userId: parsed.data.userId,
        landShare: new Prisma.Decimal(parsed.data.landShare),
      },
    });

    logAudit({
      actorId: req.user!.id,
      action: "UPDATE",
      targetType: "Cluster",
      targetId: cluster.id,
      details: { addedFarmerId: parsed.data.userId },
    });

    return res.status(201).json({ farmer });
  } catch (error) {
    next(error);
  }
});

const updateFarmerSchema = z.object({
  landShare: z.coerce.number().positive(),
});

router.patch("/:id/farmers/:userId", requireActive, requireRole(Role.REPRESENTATIVE), async (req, res, next) => {
  try {
    const parsed = updateFarmerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const cluster = await prisma.cluster.findUnique({
      where: { id: req.params.id },
      include: { representatives: true },
    });
    if (!cluster) return res.status(404).json({ error: "NOT_FOUND" });

    const isRep = cluster.representatives.some((r) => r.userId === req.user!.id);
    if (!isRep) return res.status(403).json({ error: "FORBIDDEN" });

    const updated = await prisma.clusterFarmer.update({
      where: { clusterId_userId: { clusterId: cluster.id, userId: req.params.userId } },
      data: { landShare: new Prisma.Decimal(parsed.data.landShare) },
    });

    return res.json({ farmer: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/farmers/:userId", requireActive, requireRole(Role.REPRESENTATIVE), async (req, res, next) => {
  try {
    const cluster = await prisma.cluster.findUnique({
      where: { id: req.params.id },
      include: { representatives: true },
    });
    if (!cluster) return res.status(404).json({ error: "NOT_FOUND" });

    const isRep = cluster.representatives.some((r) => r.userId === req.user!.id);
    if (!isRep) return res.status(403).json({ error: "FORBIDDEN" });

    await prisma.clusterFarmer.delete({
      where: { clusterId_userId: { clusterId: cluster.id, userId: req.params.userId } },
    });

    logAudit({
      actorId: req.user!.id,
      action: "UPDATE",
      targetType: "Cluster",
      targetId: cluster.id,
      details: { removedFarmerId: req.params.userId },
    });

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

const addRepSchema = z.object({
  userId: z.string().min(1),
});

router.post("/:id/representatives", requireActive, requireRole(Role.REPRESENTATIVE), async (req, res, next) => {
  try {
    const parsed = addRepSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY", issues: parsed.error.issues });
    }

    const cluster = await prisma.cluster.findUnique({
      where: { id: req.params.id },
      include: { representatives: true },
    });
    if (!cluster) return res.status(404).json({ error: "NOT_FOUND" });

    const isRep = cluster.representatives.some((r) => r.userId === req.user!.id);
    if (!isRep) return res.status(403).json({ error: "FORBIDDEN" });

    const rep = await prisma.clusterRepresentative.create({
      data: {
        clusterId: cluster.id,
        userId: parsed.data.userId,
        isPrimary: false,
      },
    });

    logAudit({
      actorId: req.user!.id,
      action: "UPDATE",
      targetType: "Cluster",
      targetId: cluster.id,
      details: { addedRepId: parsed.data.userId },
    });

    return res.status(201).json({ representative: rep });
  } catch (error) {
    next(error);
  }
});

export default router;
