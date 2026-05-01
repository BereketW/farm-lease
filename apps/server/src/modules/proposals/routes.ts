import { Router } from "express";
import { Role } from "@prisma/client";
import { requireRole, requireSession } from "../../lib/auth";
import {
  createProposalDraft,
  createRevision,
  decideProposal,
  deleteProposalDraft,
  getProposal,
  listMessages,
  listProposals,
  markMessagesRead,
  postMessage,
  submitProposal,
  submitProposalDraft,
  updateProposalDraft,
  withdrawProposal,
} from "./handlers";

const router = Router();

router.use(requireSession);

// Drafts — must come before /:id routes so "drafts" isn't treated as an id.
router.post("/drafts", requireRole(Role.INVESTOR), createProposalDraft);
router.patch("/drafts/:id", requireRole(Role.INVESTOR), updateProposalDraft);
router.delete("/drafts/:id", requireRole(Role.INVESTOR), deleteProposalDraft);

router.post("/", requireRole(Role.INVESTOR), submitProposal);
router.get("/", listProposals);
router.get("/:id", getProposal);
router.post("/:id/submit", requireRole(Role.INVESTOR), submitProposalDraft);
router.post("/:id/decision", requireRole(Role.REPRESENTATIVE), decideProposal);
router.post("/:id/withdraw", requireRole(Role.INVESTOR), withdrawProposal);
router.post("/:id/revisions", createRevision);
router.get("/:id/messages", listMessages);
router.post("/:id/messages", postMessage);
router.post("/:id/messages/read", markMessagesRead);

export default router;
