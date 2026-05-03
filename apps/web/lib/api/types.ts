export type ProposalStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_NEGOTIATION"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type AgreementStatus =
  | "DRAFT"
  | "PENDING_SIGNATURES"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type ReceiptStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type ResourceCategory =
  | "INSURANCE"
  | "LABOR_UNION"
  | "WORKER_GROUP"
  | "EQUIPMENT"
  | "ADVISORY";

export type Role = "INVESTOR" | "FARMER" | "REPRESENTATIVE" | "ADMIN";

export type ClusterRepLite = {
  userId: string;
  isPrimary: boolean;
  user?: { id: string; name: string | null; email: string };
};

export type ClusterSummary = {
  id: string;
  name: string;
  region?: string | null;
  description?: string | null;
  location?: string | null;
  totalArea?: string | number | null;
  cropTypes?: string[];
  representatives?: ClusterRepLite[];
  _count?: { farmers: number; proposals: number };
};

export type ClusterDetail = ClusterSummary & {
  farmers: Array<{
    id: string;
    user: { id: string; name: string | null; role: string };
  }>;
};

export type ProposalTerms = {
  title?: string;
  summary?: string;
  cropType?: string;
  conditions?: string;
  [key: string]: unknown;
};

export type ProposalSummary = {
  id: string;
  status: ProposalStatus;
  budget: string;
  durationMonths: number;
  startDate?: string | null;
  cropIntended?: string | null;
  documents: string[];
  terms: ProposalTerms;
  createdAt: string;
  updatedAt: string;
  cluster: { id: string; name: string; region?: string | null };
  investor: { id: string; name: string | null };
};

export type NegotiationMessage = {
  id: string;
  proposalId: string;
  senderId: string;
  message: string;
  attachments: string[];
  counterTerms?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string | null };
};

export type ProposalViewer = {
  id: string;
  isInvestor: boolean;
  isRepresentative: boolean;
  isAdmin: boolean;
};

export type ProposalDetail = ProposalSummary & {
  cluster: ClusterSummary & {
    representatives: Array<{ userId: string; isPrimary: boolean }>;
  };
  investor: { id: string; name: string | null; email: string };
  messages: NegotiationMessage[];
};

export type AgreementSignature = {
  id: string;
  agreementId: string;
  signerId: string;
  role: Role;
  signedAt: string;
  signer?: { id: string; name: string | null; role: Role };
};

export type PaymentReceipt = {
  id: string;
  agreementId: string;
  uploaderId: string;
  amount: string;
  datePaid: string;
  imageUrl: string;
  notes?: string | null;
  verificationStatus: ReceiptStatus;
  verifiedById?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  uploader?: { id: string; name: string | null };
  verifiedBy?: { id: string; name: string | null } | null;
};

export type ResourceSuggestion = {
  id: string;
  category: ResourceCategory;
  title: string;
  description?: string | null;
  providerName?: string | null;
  contactInfo?: Record<string, string> | null;
  region?: string | null;
  cropTypes: string[];
  estimatedCost?: string | null;
  notes?: string | null;
  isRecommended: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AgreementSummary = {
  id: string;
  proposalId: string;
  status: AgreementStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  proposal: {
    id: string;
    budget: string;
    durationMonths: number;
    cluster: { id: string; name: string; region?: string | null };
    investor: { id: string; name: string | null };
  };
  signatures: Array<{ signerId: string; role: Role; signedAt: string }>;
  _count?: { receipts: number };
};

export type AgreementTerms = {
  parties?: {
    investor?: { id: string; name: string | null; email: string };
    cluster?: {
      id: string;
      name: string;
      location: string | null;
      region: string | null;
      totalArea?: string | null;
      coordinates?: unknown;
    };
  };
  lease?: {
    startDate: string;
    endDate: string;
    durationMonths: number;
    cropIntended?: string | null;
  };
  financial?: { budget: string; currency: string };
  negotiatedTerms?: Record<string, unknown>;
  supportingDocuments?: string[];
};

export type AgreementClause = { title: string; body: string };

export type AgreementDetail = Omit<AgreementSummary, "proposal" | "signatures"> & {
  terms: AgreementTerms;
  clauses: AgreementClause[];
  proposal: ProposalDetail;
  signatures: AgreementSignature[];
};

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "STATE_CHANGE"
  | "SIGN"
  | "VERIFY"
  | "REJECT"
  | "CANCEL"
  | "ACTIVATE"
  | "COMPLETE"
  | "AGREEMENT_COMPLETED"
  | "TERMS_EDITED";

export type AuditTargetType = "Proposal" | "Agreement" | "PaymentReceipt" | "User" | "Cluster";

export type AuditLog = {
  id: string;
  actorId: string;
  actor: { id: string; name: string | null; role: Role };
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: {
    from?: Record<string, unknown>;
    to?: Record<string, unknown>;
    reason?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
};
