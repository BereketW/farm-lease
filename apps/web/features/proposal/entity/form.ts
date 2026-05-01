import { z } from "zod";

export const proposalFormSchema = z.object({
  clusterId: z.string().min(1, "Select a cluster"),
  title: z.string().min(3, "Title is required"),
  summary: z.string().max(2000).optional(),
  durationMonths: z.coerce.number().int().positive("Duration must be > 0"),
  startDate: z.string().optional(),
  budget: z.coerce.number().positive("Budget must be > 0"),
  currency: z.string().min(3).default("ETB"),
  cropType: z.string().min(1, "Crop type is required"),
  conditions: z.string().max(2000).optional(),
});

export type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export const FORM_STEPS = [
  { id: "cluster", label: "Cluster" },
  { id: "terms", label: "Lease terms" },
  { id: "conditions", label: "Conditions" },
  { id: "documents", label: "Documents" },
  { id: "review", label: "Review" },
] as const;

export type StepId = (typeof FORM_STEPS)[number]["id"];
