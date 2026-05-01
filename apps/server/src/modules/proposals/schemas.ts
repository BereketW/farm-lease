import { z } from "zod";

export const proposalCreateSchema = z.object({
  clusterId: z.string().min(1),
  budget: z.number().positive(),
  durationMonths: z.number().int().positive().max(600),
  startDate: z.string().datetime().optional(),
  cropIntended: z.string().max(200).optional(),
  terms: z.record(z.string(), z.unknown()),
  documents: z.array(z.string()).optional(),
});

export const proposalListQuerySchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "UNDER_NEGOTIATION",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
    ])
    .optional(),
  clusterId: z.string().optional(),
});

export const proposalDecisionSchema = z.object({
  decision: z.enum(["ACCEPT", "REJECT"]),
  reason: z.string().max(500).optional(),
});

export const proposalRevisionSchema = z.object({
  budget: z.number().positive(),
  durationMonths: z.number().int().positive().max(600),
  terms: z.record(z.string(), z.unknown()),
  note: z.string().max(2000).optional(),
});

export const negotiationMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  counterTerms: z.record(z.string(), z.unknown()).optional(),
  attachments: z.array(z.string().url()).max(10).optional(),
});

export const messagesQuerySchema = z.object({
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

/**
 * Draft creation: clusterId is the only hard requirement (Proposal.clusterId
 * is NOT NULL in the DB). Everything else is optional and gets a safe
 * zero-ish default until the investor fills it in.
 */
export const proposalDraftCreateSchema = z.object({
  clusterId: z.string().min(1),
  budget: z.number().nonnegative().optional(),
  durationMonths: z.number().int().nonnegative().max(600).optional(),
  startDate: z.string().datetime().optional().nullable(),
  cropIntended: z.string().max(200).optional().nullable(),
  terms: z.record(z.string(), z.unknown()).optional(),
  documents: z.array(z.string()).optional(),
});

/**
 * Draft patch: every field optional. `clusterId` can be changed if the
 * user switches clusters mid-draft.
 */
export const proposalDraftPatchSchema = z.object({
  clusterId: z.string().min(1).optional(),
  budget: z.number().nonnegative().optional(),
  durationMonths: z.number().int().nonnegative().max(600).optional(),
  startDate: z.string().datetime().optional().nullable(),
  cropIntended: z.string().max(200).optional().nullable(),
  terms: z.record(z.string(), z.unknown()).optional(),
  documents: z.array(z.string()).optional(),
});
