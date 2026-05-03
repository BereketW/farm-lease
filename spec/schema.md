# FarmLease DB and Domain-State Specification

Last updated: 2026-05-02

Recent changes (2026-05-01): A new `EmailLog` model was added to the Prisma schema and a corresponding migration is present at `packages/db/prisma/migrations/20260501101355_add_email_logs/`. The mailer persists delivery attempts to this table; the table is append-only and indexed on `recipient`, `status`, and `createdAt`.

This document is derived from `packages/db/prisma/schema.prisma` and the observed runtime behavior in `apps/server/src`. When runtime behavior and schema shape differ, the runtime rules below describe how records actually move through the system.

## 1. Scope and storage model

FarmLease persists its core data in PostgreSQL through Prisma. The schema uses:

- UUID primary keys for all tables.
- `DateTime` timestamps for creation, updates, lifecycle tracking, and verification events.
- `Json` for flexible business payloads such as proposal terms, agreement clauses, metadata, geodata, and audit details.
- Array fields for sets of strings such as crop types, permissions, attachments, documents, and notifications.
- Decimal columns for money, land shares, and model outputs.

Better Auth owns the base authentication tables (`user`, `session`, `account`, `verification`). FarmLease extends `user` with role, status, phone, role-specific profiles, and all domain relations.

## 2. Canonical enums

### Role

- `INVESTOR`: creates proposals, signs agreements, uploads payment receipts for their agreements.
- `FARMER`: owns farmland through cluster membership and profile data.
- `REPRESENTATIVE`: acts for a cluster in proposal review, agreement signing, receipt verification, and notifications.
- `ADMIN`: cross-cutting override for most read and moderation actions.

### UserStatus

- `PENDING`: default after auth registration before profile setup.
- `ACTIVE`: set by profile setup and dev seeding.
- `SUSPENDED`: reserved status; no runtime transition was observed in server code.

### ClusterStatus

- `PENDING`: default cluster state.
- `VERIFIED`: used by seeded clusters and query flows.
- `REJECTED`: reserved for moderation workflows; no observed server transition handler.

### ProposalStatus

- `DRAFT`: editable investor draft.
- `SUBMITTED`: sent to the cluster for review.
- `UNDER_NEGOTIATION`: revised by investor or representative.
- `ACCEPTED`: representative accepted the proposal.
- `REJECTED`: representative rejected the proposal.
- `WITHDRAWN`: investor withdrew the proposal.

### AgreementStatus

- `DRAFT`: newly generated or re-opened for signature after terms edits.
- `PENDING_SIGNATURES`: both parties have signed; in runtime this means the agreement is awaiting payment verification, not awaiting signatures.
- `ACTIVE`: payment has been verified.
- `COMPLETED`: lease term ended and the lifecycle job closed the agreement.
- `CANCELLED`: manually cancelled by an authorized party.

### ReceiptStatus

- `PENDING`: uploaded but not yet reviewed.
- `VERIFIED`: representative/admin approved the receipt.
- `REJECTED`: representative/admin rejected the receipt.

## 3. Entity catalog

| Model                   | Purpose                                                         | Key constraints and runtime notes                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`                  | Authenticated person and root identity for all app access.      | `email` is unique. `role` defaults to `INVESTOR`. `status` defaults to `PENDING`. Deleting a user cascades sessions and accounts through Better Auth and cascades many FarmLease relations.       |
| `session`               | Better Auth session record.                                     | Unique `token`. Cascades on user delete. Used by `getRequestSession` and auth guards.                                                                                                             |
| `account`               | Better Auth linked login provider record.                       | Stores provider credentials and tokens. Cascades on user delete.                                                                                                                                  |
| `verification`          | Better Auth verification records.                               | Standalone auth verification table.                                                                                                                                                               |
| `InvestorProfile`       | Investor-specific profile data.                                 | One-to-one with `user` via unique `userId`. Created in `/users/setup-profile` for `INVESTOR`.                                                                                                     |
| `FarmerProfile`         | Farmer-specific profile data.                                   | One-to-one with `user` via unique `userId`. Created in `/users/setup-profile` for `FARMER`.                                                                                                       |
| `RepresentativeProfile` | Representative-specific profile data.                           | One-to-one with `user` via unique `userId`. Created in `/users/setup-profile` for `REPRESENTATIVE`.                                                                                               |
| `Cluster`               | Cluster/land aggregate that proposals target.                   | Contains identity, location, geodata, coordinates, area, crop types, documents, and status. Has many farmers, representatives, proposals, and AI predictions.                                     |
| `ClusterFarmer`         | Membership join table between a cluster and a farmer user.      | Composite unique on `(clusterId, userId)`. Deletion cascades from both sides.                                                                                                                     |
| `ClusterRepresentative` | Representative assignment join table.                           | Composite unique on `(clusterId, userId)`. `isPrimary` marks the preferred representative for notifications and UI fallbacks.                                                                     |
| `Proposal`              | Negotiation record between an investor and a cluster.           | Belongs to one cluster and one investor. Holds mutable JSON terms, budget, duration, dates, crop intent, documents, status, and rejection reason. One proposal can produce at most one agreement. |
| `NegotiationMessage`    | Proposal chat and counter-term history.                         | Belongs to one proposal and one sender. Tracks attachments, optional counter-terms, and read state. Deleted with proposal.                                                                        |
| `Agreement`             | Accepted proposal turned into a contract draft and later lease. | One-to-one with proposal via unique `proposalId`. Stores contract dates, JSON terms, JSON clauses, and lifecycle status.                                                                          |
| `AgreementSignature`    | Signature record for an agreement signer.                       | Composite unique on `(agreementId, signerId)`. Stores signer role and signed timestamp. Deleted with agreement.                                                                                   |
| `PaymentReceipt`        | Proof of payment uploaded for an agreement.                     | Belongs to one agreement and one uploader. Stores amount, date paid, file URL, optional notes, verification state, verifier, and rejection reason.                                                |
| `AIRecommendation`      | Investor recommendation output.                                 | Stores criteria and ranked clusters payloads plus model version.                                                                                                                                  |
| `AIPrediction`          | Cluster prediction output.                                      | Stores request features and predicted yield, cost, ROI, confidence, risk, and model version.                                                                                                      |
| `Notification`          | In-app notification fanout target.                              | Belongs to one user. `isRead` and `readAt` model inbox state. `metadata` carries deep links and related ids.                                                                                      |
| `AuditLog`              | Append-only audit trail of user and system actions.             | Records actor, action, target type/id, and freeform JSON details.                                                                                                                                 |
| `EmailLog`              | Append-only email delivery log.                                 | Written by the mailer after each send attempt sequence. Tracks recipient, subject, status, attempts, timestamps, and failure text.                                                                |

## 4. Relationship map

### User-centric relations

- One user can have many sessions and accounts.
- One user can have zero or one of each role-specific profile.
- One user can belong to many cluster-farmer memberships and many cluster-representative assignments.
- One user can author many proposals, negotiation messages, signatures, uploaded receipts, notifications, audit logs, AI recommendations, and AI predictions.
- One user can verify many receipts through the named `ReceiptVerifier` relation.

### Cluster-centric relations

- One cluster can have many farmers, representatives, proposals, and AI predictions.
- A cluster representative row may be marked primary; runtime notification routing falls back to the first representative if no primary exists.
- A cluster is the ownership anchor for proposal visibility and agreement access through its representatives.

### Proposal and agreement relations

- One proposal belongs to exactly one cluster and one investor.
- One proposal can have many negotiation messages.
- One proposal can have zero or one agreement.
- One agreement belongs to exactly one proposal.
- One agreement can have many signatures and many payment receipts.

### Receipt and notification relations

- One receipt belongs to one agreement and one uploader.
- One receipt can optionally have one verifier.
- One notification belongs to one user and is read independently of other notifications.

## 5. State machines and lifecycle rules

### 5.1 User onboarding

Observed runtime flow:

1. Registration creates a `user` row through Better Auth with `status = PENDING`.
2. `/users/setup-profile` sets `role` and flips `status` to `ACTIVE`.
3. The same endpoint creates the matching role profile record:
    - `InvestorProfile` with empty `preferredRegions` and `preferredCrops`.
    - `FarmerProfile` with default fields.
    - `RepresentativeProfile` with empty `permissions`.

Important invariant:

- The runtime expects a role to map to exactly one profile type, but the database does not enforce that relationship automatically.

### 5.2 Cluster lifecycle

Observed runtime behavior:

- The schema supports `PENDING`, `VERIFIED`, and `REJECTED` cluster states.
- Dev seeding writes clusters as `VERIFIED`.
- The current server code does not expose a cluster moderation endpoint in the inspected runtime surface.

Practical effect:

- Clusters act as durable reference data and ownership anchors for proposals rather than as actively transitioning workflow objects.

### 5.3 Proposal lifecycle

The proposal state machine is the most active mutable flow in the system.

| From                                          | To                  | Trigger                                     | Guard / behavior                                                                     | Side effects                                                                           |
| --------------------------------------------- | ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| none                                          | `DRAFT`             | Investor creates a draft proposal           | Draft creation requires a cluster and initializes safe defaults for optional fields. | Audit entry for draft creation.                                                        |
| `DRAFT`                                       | `SUBMITTED`         | Investor submits the draft                  | Draft must have positive budget, positive duration, and at least one term entry.     | Proposal submitted notification to the primary representative or first representative. |
| `DRAFT`                                       | `SUBMITTED`         | Non-draft proposal create endpoint          | Direct create path persists as submitted immediately.                                | Submission notification.                                                               |
| `SUBMITTED` or `UNDER_NEGOTIATION`            | `ACCEPTED`          | Representative accepts                      | Only representatives can decide; terminal states are blocked.                        | Agreement is auto-generated as `DRAFT`, audit entry, acceptance notification.          |
| `SUBMITTED` or `UNDER_NEGOTIATION`            | `REJECTED`          | Representative rejects                      | Optional rejection reason.                                                           | Rejection notification and audit entry.                                                |
| `DRAFT` or `SUBMITTED` or `UNDER_NEGOTIATION` | `UNDER_NEGOTIATION` | Investor or representative posts a revision | Only open proposals can be revised.                                                  | Terms, budget, and duration are replaced; counterparty notification sent.              |
| `DRAFT` or `SUBMITTED` or `UNDER_NEGOTIATION` | `WITHDRAWN`         | Investor withdraws                          | Only the investor may withdraw; terminal states are blocked.                         | Withdrawal notification to the representative side.                                    |
| `DRAFT`                                       | deleted             | Investor or admin hard-deletes draft        | Hard delete is only allowed while still a draft.                                     | No terminal notifications.                                                             |

Proposal invariants:

- `ACCEPTED`, `REJECTED`, and `WITHDRAWN` are terminal states.
- Once terminal, the proposal cannot be edited or further transitioned by the observed handlers.
- Proposal queries are access-scoped: investors see their own proposals, representatives see proposals for clusters they represent, admins see all.
- Proposal terms are flexible JSON in the database; completeness is enforced in application code before submission.

### 5.4 Agreement lifecycle

Agreements are generated from accepted proposals and then move through signing, payment, activation, and eventual completion.

| From                            | To                   | Trigger                                                                       | Guard / behavior                                                                                                                       | Side effects                                                                                                                           |
| ------------------------------- | -------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| none                            | `DRAFT`              | `generateAgreementFromProposal` runs after proposal acceptance                | One agreement per proposal; generation is idempotent.                                                                                  | Builds derived terms JSON and default clauses, audit entry, creation notification.                                                     |
| `DRAFT`                         | `DRAFT`              | One party signs                                                               | Agreement must be in `DRAFT` or `PENDING_SIGNATURES`, signer must be investor or representative, and duplicate signatures are blocked. | Signature row inserted, audit entry, realtime update.                                                                                  |
| `DRAFT`                         | `PENDING_SIGNATURES` | Both investor and representative side have signed                             | The status name is legacy; the runtime uses it to mean the agreement is fully signed and awaiting payment verification.                | Counterparty notification and realtime update.                                                                                         |
| `PENDING_SIGNATURES`            | `PENDING_SIGNATURES` | Additional allowed sign action by the second party when already partly signed | Signature set grows until both sides are present.                                                                                      | Same notification and realtime side effects.                                                                                           |
| `DRAFT` or `PENDING_SIGNATURES` | `DRAFT`              | Agreement terms are edited                                                    | Allowed only before activation; edit clears all signatures in one transaction.                                                         | Signatures deleted, status reset to `DRAFT`, edit notification, audit entry.                                                           |
| any non-terminal state          | `CANCELLED`          | Investor, representative, or admin cancels                                    | `COMPLETED` and `CANCELLED` agreements cannot be cancelled again.                                                                      | Cancellation notification, audit entry, realtime update.                                                                               |
| `PENDING_SIGNATURES`            | `ACTIVE`             | Verified receipt is accepted                                                  | Verification must be done by representative or admin, and the receipt must still be `PENDING`.                                         | Receipt becomes `VERIFIED`, verifier fields are set, payment verified notification, agreement activated notification, realtime update. |
| `ACTIVE`                        | `COMPLETED`          | `agreement-lifecycle.ts` job finds `endDate <= now`                           | Job only targets `ACTIVE` agreements and is idempotent.                                                                                | Audit entry and completion notification.                                                                                               |

Agreement invariants:

- There is at most one agreement per proposal.
- Agreement terms are derived from the accepted proposal and include investor details, cluster details, lease dates, financial values, the negotiated JSON payload, and supporting documents.
- Agreement clauses are application-generated defaults, not schema-enforced content.
- Editing terms after activation is blocked in the runtime surface.

### 5.5 Signature lifecycle

- `AgreementSignature` rows are append-only for a given signer because `(agreementId, signerId)` is unique.
- The runtime checks whether the current signer already exists before inserting a new signature.
- The agreement status is recomputed after each signature using the presence of investor and representative signers.
- The runtime stores the signer role on the signature row for audit and display.

### 5.6 Payment receipt lifecycle

| From      | To         | Trigger                                  | Guard / behavior                                                                                         | Side effects                                                                                                                                   |
| --------- | ---------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| none      | `PENDING`  | Investor uploads a receipt image         | Agreement must exist and be exactly `PENDING_SIGNATURES`; only the investor on the agreement may upload. | Receipt created, audit entry, receipt-submitted notification to the representative side, realtime update.                                      |
| `PENDING` | `VERIFIED` | Representative or admin verifies receipt | Receipt must still be pending.                                                                           | Verifier fields set, agreement set to `ACTIVE`, audit entry, payment verified notification, agreement activated notification, realtime update. |
| `PENDING` | `REJECTED` | Representative or admin rejects receipt  | Receipt must still be pending.                                                                           | Verifier fields set, rejection reason stored, payment rejected notification, realtime update.                                                  |

Receipt invariants:

- Only the investor tied to the agreement can upload a receipt.
- Only a representative on that agreement or an admin can verify/reject.
- Verification does not create a new agreement state if the receipt is rejected; rejection leaves the agreement in its prior state.

### 5.7 Notification lifecycle

- Notifications are created through `dispatchNotification` and its higher-level event helpers.
- Each notification belongs to one recipient user.
- The inbox is unread by default (`isRead = false`, `readAt = null`).
- Reading a notification sets `isRead = true` and `readAt`.
- `read-all` marks all unread notifications for the current user as read.

Runtime delivery pattern:

- A notification row is inserted first.
- A realtime event is emitted to the recipient.
- Email delivery is attempted unless the event opts out.
- The mailer writes an `EmailLog` row after the retry cycle completes, regardless of success or failure.

### 5.8 Audit and email logs

- `AuditLog` is append-only and records user or system actions against a target entity.
- `EmailLog` is append-only and records each delivery attempt sequence with status, attempts, and optional failure reason.
- Neither table currently has a runtime update path that mutates the original row after creation.

## 6. Derived JSON shapes and application-owned structure

### Proposal terms

Proposal terms are flexible JSON at the database layer, but runtime code expects an object shape and uses it to generate agreement terms.

### Agreement terms

Generated agreement terms currently follow this shape:

- `parties.investor`: id, name, email.
- `parties.cluster`: id, name, location, region, totalArea, coordinates.
- `lease`: startDate, endDate, durationMonths, cropIntended.
- `financial`: budget, currency.
- `negotiatedTerms`: copied proposal terms.
- `supportingDocuments`: copied proposal documents.

### Agreement clauses

The runtime seeds a standard clause set covering:

- parties
- term
- lease payment
- use of land
- farmer obligations
- termination
- dispute resolution
- digital signatures

These clauses are stored as JSON and are not validated by Prisma beyond being JSON content.

### Notification metadata

Notifications commonly store:

- the related entity id (`proposalId`, `agreementId`, or `receiptId`)
- a deep link `url`

### Audit details

Audit entries store action-specific JSON, such as the state transition target, rejection reason, edited-term flags, or system-trigger metadata.

## 7. Database constraints worth preserving

- `user.email` is unique.
- `session.token` is unique.
- `InvestorProfile.userId`, `FarmerProfile.userId`, and `RepresentativeProfile.userId` are unique to enforce one profile of each kind per user.
- `(clusterId, userId)` is unique in `ClusterFarmer` and `ClusterRepresentative`.
- `Agreement.proposalId` is unique to enforce one agreement per proposal.
- `(agreementId, signerId)` is unique in `AgreementSignature` to block duplicate signatures.
- `EmailLog` has indexes on `recipient`, `status`, and `createdAt` for operational querying.

## 8. Runtime gaps and mismatches to keep in mind

1. `AgreementStatus.PENDING_SIGNATURES` means fully signed but awaiting payment, even though the name suggests the opposite.
2. `ClusterStatus` exists in the schema, but no cluster moderation flow was observed in the server routes inspected for this spec.
3. `UserStatus.SUSPENDED` exists in the schema, but no suspension workflow was observed in the server runtime.
4. Proposal and agreement JSON structures are application-owned; the database does not enforce the nested shapes.
5. Terms edits intentionally clear signatures and revert the agreement to `DRAFT` so both parties must re-sign.

## 9. Operational summary

- Users register, choose a role, and become active through profile setup.
- Investors create and submit proposals against verified or pending clusters.
- Representatives decide proposals, generating agreements when they accept.
- Both sides sign agreements, after which the investor uploads a receipt.
- Verification activates the agreement, and the daily lifecycle job completes it at end date.
- Notifications, audits, and email logs record the cross-cutting history of those actions.

# FarmLease DB and Domain-State Specification

Last updated: 2026-05-01

This document is derived from `packages/db/prisma/schema.prisma` and the observed runtime behavior in `apps/server/src`. When runtime behavior and schema shape differ, the runtime rules below describe how records actually move through the system.

## 1. Scope and storage model

FarmLease persists its core data in PostgreSQL through Prisma. The schema uses:

- UUID primary keys for all tables.
- `DateTime` timestamps for creation, updates, lifecycle tracking, and verification events.
- `Json` for flexible business payloads such as proposal terms, agreement clauses, metadata, geodata, and audit details.
- Array fields for sets of strings such as crop types, permissions, attachments, documents, and notifications.
- Decimal columns for money, land shares, and model outputs.

Better Auth owns the base authentication tables (`user`, `session`, `account`, `verification`). FarmLease extends `user` with role, status, phone, role-specific profiles, and all domain relations.

## 2. Canonical enums

### Role

- `INVESTOR`: creates proposals, signs agreements, uploads payment receipts for their agreements.
- `FARMER`: owns farmland through cluster membership and profile data.
- `REPRESENTATIVE`: acts for a cluster in proposal review, agreement signing, receipt verification, and notifications.
- `ADMIN`: cross-cutting override for most read and moderation actions.

### UserStatus

- `PENDING`: default after auth registration before profile setup.
- `ACTIVE`: set by profile setup and dev seeding.
- `SUSPENDED`: reserved status; no runtime transition was observed in server code.

### ClusterStatus

- `PENDING`: default cluster state.
- `VERIFIED`: used by seeded clusters and query flows.
- `REJECTED`: reserved for moderation workflows; no observed server transition handler.

### ProposalStatus

- `DRAFT`: editable investor draft.
- `SUBMITTED`: sent to the cluster for review.
- `UNDER_NEGOTIATION`: revised by investor or representative.
- `ACCEPTED`: representative accepted the proposal.
- `REJECTED`: representative rejected the proposal.
- `WITHDRAWN`: investor withdrew the proposal.

### AgreementStatus

- `DRAFT`: newly generated or re-opened for signature after terms edits.
- `PENDING_SIGNATURES`: both parties have signed; in runtime this means the agreement is awaiting payment verification, not awaiting signatures.
- `ACTIVE`: payment has been verified.
- `COMPLETED`: lease term ended and the lifecycle job closed the agreement.
- `CANCELLED`: manually cancelled by an authorized party.

### ReceiptStatus

- `PENDING`: uploaded but not yet reviewed.
- `VERIFIED`: representative/admin approved the receipt.
- `REJECTED`: representative/admin rejected the receipt.

## 3. Entity catalog

| Model                   | Purpose                                                         | Key constraints and runtime notes                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`                  | Authenticated person and root identity for all app access.      | `email` is unique. `role` defaults to `INVESTOR`. `status` defaults to `PENDING`. Deleting a user cascades sessions and accounts through Better Auth and cascades many FarmLease relations.       |
| `session`               | Better Auth session record.                                     | Unique `token`. Cascades on user delete. Used by `getRequestSession` and auth guards.                                                                                                             |
| `account`               | Better Auth linked login provider record.                       | Stores provider credentials and tokens. Cascades on user delete.                                                                                                                                  |
| `verification`          | Better Auth verification records.                               | Standalone auth verification table.                                                                                                                                                               |
| `InvestorProfile`       | Investor-specific profile data.                                 | One-to-one with `user` via unique `userId`. Created in `/users/setup-profile` for `INVESTOR`.                                                                                                     |
| `FarmerProfile`         | Farmer-specific profile data.                                   | One-to-one with `user` via unique `userId`. Created in `/users/setup-profile` for `FARMER`.                                                                                                       |
| `RepresentativeProfile` | Representative-specific profile data.                           | One-to-one with `user` via unique `userId`. Created in `/users/setup-profile` for `REPRESENTATIVE`.                                                                                               |
| `Cluster`               | Cluster/land aggregate that proposals target.                   | Contains identity, location, geodata, coordinates, area, crop types, documents, and status. Has many farmers, representatives, proposals, and AI predictions.                                     |
| `ClusterFarmer`         | Membership join table between a cluster and a farmer user.      | Composite unique on `(clusterId, userId)`. Deletion cascades from both sides.                                                                                                                     |
| `ClusterRepresentative` | Representative assignment join table.                           | Composite unique on `(clusterId, userId)`. `isPrimary` marks the preferred representative for notifications and UI fallbacks.                                                                     |
| `Proposal`              | Negotiation record between an investor and a cluster.           | Belongs to one cluster and one investor. Holds mutable JSON terms, budget, duration, dates, crop intent, documents, status, and rejection reason. One proposal can produce at most one agreement. |
| `NegotiationMessage`    | Proposal chat and counter-term history.                         | Belongs to one proposal and one sender. Tracks attachments, optional counter-terms, and read state. Deleted with proposal.                                                                        |
| `Agreement`             | Accepted proposal turned into a contract draft and later lease. | One-to-one with proposal via unique `proposalId`. Stores contract dates, JSON terms, JSON clauses, and lifecycle status.                                                                          |
| `AgreementSignature`    | Signature record for an agreement signer.                       | Composite unique on `(agreementId, signerId)`. Stores signer role and signed timestamp. Deleted with agreement.                                                                                   |
| `PaymentReceipt`        | Proof of payment uploaded for an agreement.                     | Belongs to one agreement and one uploader. Stores amount, date paid, file URL, optional notes, verification state, verifier, and rejection reason.                                                |
| `AIRecommendation`      | Investor recommendation output.                                 | Stores criteria and ranked clusters payloads plus model version.                                                                                                                                  |
| `AIPrediction`          | Cluster prediction output.                                      | Stores request features and predicted yield, cost, ROI, confidence, risk, and model version.                                                                                                      |
| `Notification`          | In-app notification fanout target.                              | Belongs to one user. `isRead` and `readAt` model inbox state. `metadata` carries deep links and related ids.                                                                                      |
| `AuditLog`              | Append-only audit trail of user and system actions.             | Records actor, action, target type/id, and freeform JSON details.                                                                                                                                 |
| `EmailLog`              | Append-only email delivery log.                                 | Written by the mailer after each send attempt sequence. Tracks recipient, subject, status, attempts, timestamps, and failure text.                                                                |

## 4. Relationship map

### User-centric relations

- One user can have many sessions and accounts.
- One user can have zero or one of each role-specific profile.
- One user can belong to many cluster-farmer memberships and many cluster-representative assignments.
- One user can author many proposals, negotiation messages, signatures, uploaded receipts, notifications, audit logs, AI recommendations, and AI predictions.
- One user can verify many receipts through the named `ReceiptVerifier` relation.

### Cluster-centric relations

- One cluster can have many farmers, representatives, proposals, and AI predictions.
- A cluster representative row may be marked primary; runtime notification routing falls back to the first representative if no primary exists.
- A cluster is the ownership anchor for proposal visibility and agreement access through its representatives.

### Proposal and agreement relations

- One proposal belongs to exactly one cluster and one investor.
- One proposal can have many negotiation messages.
- One proposal can have zero or one agreement.
- One agreement belongs to exactly one proposal.
- One agreement can have many signatures and many payment receipts.

### Receipt and notification relations

- One receipt belongs to one agreement and one uploader.
- One receipt can optionally have one verifier.
- One notification belongs to one user and is read independently of other notifications.

## 5. State machines and lifecycle rules

### 5.1 User onboarding

Observed runtime flow:

1. Registration creates a `user` row through Better Auth with `status = PENDING`.
2. `/users/setup-profile` sets `role` and flips `status` to `ACTIVE`.
3. The same endpoint creates the matching role profile record:
    - `InvestorProfile` with empty `preferredRegions` and `preferredCrops`.
    - `FarmerProfile` with default fields.
    - `RepresentativeProfile` with empty `permissions`.

Important invariant:

- The runtime expects a role to map to exactly one profile type, but the database does not enforce that relationship automatically.

### 5.2 Cluster lifecycle

Observed runtime behavior:

- The schema supports `PENDING`, `VERIFIED`, and `REJECTED` cluster states.
- Dev seeding writes clusters as `VERIFIED`.
- The current server code does not expose a cluster moderation endpoint in the inspected runtime surface.

Practical effect:

- Clusters act as durable reference data and ownership anchors for proposals rather than as actively transitioning workflow objects.

### 5.3 Proposal lifecycle

The proposal state machine is the most active mutable flow in the system.

| From                                          | To                  | Trigger                                     | Guard / behavior                                                                     | Side effects                                                                           |
| --------------------------------------------- | ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| none                                          | `DRAFT`             | Investor creates a draft proposal           | Draft creation requires a cluster and initializes safe defaults for optional fields. | Audit entry for draft creation.                                                        |
| `DRAFT`                                       | `SUBMITTED`         | Investor submits the draft                  | Draft must have positive budget, positive duration, and at least one term entry.     | Proposal submitted notification to the primary representative or first representative. |
| `DRAFT`                                       | `SUBMITTED`         | Non-draft proposal create endpoint          | Direct create path persists as submitted immediately.                                | Submission notification.                                                               |
| `SUBMITTED` or `UNDER_NEGOTIATION`            | `ACCEPTED`          | Representative accepts                      | Only representatives can decide; terminal states are blocked.                        | Agreement is auto-generated as `DRAFT`, audit entry, acceptance notification.          |
| `SUBMITTED` or `UNDER_NEGOTIATION`            | `REJECTED`          | Representative rejects                      | Optional rejection reason.                                                           | Rejection notification and audit entry.                                                |
| `DRAFT` or `SUBMITTED` or `UNDER_NEGOTIATION` | `UNDER_NEGOTIATION` | Investor or representative posts a revision | Only open proposals can be revised.                                                  | Terms, budget, and duration are replaced; counterparty notification sent.              |
| `DRAFT` or `SUBMITTED` or `UNDER_NEGOTIATION` | `WITHDRAWN`         | Investor withdraws                          | Only the investor may withdraw; terminal states are blocked.                         | Withdrawal notification to the representative side.                                    |
| `DRAFT`                                       | deleted             | Investor or admin hard-deletes draft        | Hard delete is only allowed while still a draft.                                     | No terminal notifications.                                                             |

Proposal invariants:

- `ACCEPTED`, `REJECTED`, and `WITHDRAWN` are terminal states.
- Once terminal, the proposal cannot be edited or further transitioned by the observed handlers.
- Proposal queries are access-scoped: investors see their own proposals, representatives see proposals for clusters they represent, admins see all.
- Proposal terms are flexible JSON in the database; completeness is enforced in application code before submission.

### 5.4 Agreement lifecycle

Agreements are generated from accepted proposals and then move through signing, payment, activation, and eventual completion.

| From                            | To                   | Trigger                                                                       | Guard / behavior                                                                                                                       | Side effects                                                                                                                           |
| ------------------------------- | -------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| none                            | `DRAFT`              | `generateAgreementFromProposal` runs after proposal acceptance                | One agreement per proposal; generation is idempotent.                                                                                  | Builds derived terms JSON and default clauses, audit entry, creation notification.                                                     |
| `DRAFT`                         | `DRAFT`              | One party signs                                                               | Agreement must be in `DRAFT` or `PENDING_SIGNATURES`, signer must be investor or representative, and duplicate signatures are blocked. | Signature row inserted, audit entry, realtime update.                                                                                  |
| `DRAFT`                         | `PENDING_SIGNATURES` | Both investor and representative side have signed                             | The status name is legacy; the runtime uses it to mean the agreement is fully signed and awaiting payment verification.                | Counterparty notification and realtime update.                                                                                         |
| `PENDING_SIGNATURES`            | `PENDING_SIGNATURES` | Additional allowed sign action by the second party when already partly signed | Signature set grows until both sides are present.                                                                                      | Same notification and realtime side effects.                                                                                           |
| `DRAFT` or `PENDING_SIGNATURES` | `DRAFT`              | Agreement terms are edited                                                    | Allowed only before activation; edit clears all signatures in one transaction.                                                         | Signatures deleted, status reset to `DRAFT`, edit notification, audit entry.                                                           |
| any non-terminal state          | `CANCELLED`          | Investor, representative, or admin cancels                                    | `COMPLETED` and `CANCELLED` agreements cannot be cancelled again.                                                                      | Cancellation notification, audit entry, realtime update.                                                                               |
| `PENDING_SIGNATURES`            | `ACTIVE`             | Verified receipt is accepted                                                  | Verification must be done by representative or admin, and the receipt must still be `PENDING`.                                         | Receipt becomes `VERIFIED`, verifier fields are set, payment verified notification, agreement activated notification, realtime update. |
| `ACTIVE`                        | `COMPLETED`          | `agreement-lifecycle.ts` job finds `endDate <= now`                           | Job only targets `ACTIVE` agreements and is idempotent.                                                                                | Audit entry and completion notification.                                                                                               |

Agreement invariants:

- There is at most one agreement per proposal.
- Agreement terms are derived from the accepted proposal and include investor details, cluster details, lease dates, financial values, the negotiated JSON payload, and supporting documents.
- Agreement clauses are application-generated defaults, not schema-enforced content.
- Editing terms after activation is blocked in the runtime surface.

### 5.5 Signature lifecycle

- `AgreementSignature` rows are append-only for a given signer because `(agreementId, signerId)` is unique.
- The runtime checks whether the current signer already exists before inserting a new signature.
- The agreement status is recomputed after each signature using the presence of investor and representative signers.
- The runtime stores the signer role on the signature row for audit and display.

### 5.6 Payment receipt lifecycle

| From      | To         | Trigger                                  | Guard / behavior                                                                                         | Side effects                                                                                                                                   |
| --------- | ---------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| none      | `PENDING`  | Investor uploads a receipt image         | Agreement must exist and be exactly `PENDING_SIGNATURES`; only the investor on the agreement may upload. | Receipt created, audit entry, receipt-submitted notification to the representative side, realtime update.                                      |
| `PENDING` | `VERIFIED` | Representative or admin verifies receipt | Receipt must still be pending.                                                                           | Verifier fields set, agreement set to `ACTIVE`, audit entry, payment verified notification, agreement activated notification, realtime update. |
| `PENDING` | `REJECTED` | Representative or admin rejects receipt  | Receipt must still be pending.                                                                           | Verifier fields set, rejection reason stored, payment rejected notification, realtime update.                                                  |

Receipt invariants:

- Only the investor tied to the agreement can upload a receipt.
- Only a representative on that agreement or an admin can verify/reject.
- Verification does not create a new agreement state if the receipt is rejected; rejection leaves the agreement in its prior state.

### 5.7 Notification lifecycle

- Notifications are created through `dispatchNotification` and its higher-level event helpers.
- Each notification belongs to one recipient user.
- The inbox is unread by default (`isRead = false`, `readAt = null`).
- Reading a notification sets `isRead = true` and `readAt`.
- `read-all` marks all unread notifications for the current user as read.

Runtime delivery pattern:

- A notification row is inserted first.
- A realtime event is emitted to the recipient.
- Email delivery is attempted unless the event opts out.
- The mailer writes an `EmailLog` row after the retry cycle completes, regardless of success or failure.

### 5.8 Audit and email logs

- `AuditLog` is append-only and records user or system actions against a target entity.
- `EmailLog` is append-only and records each delivery attempt sequence with status, attempts, and optional failure reason.
- Neither table currently has a runtime update path that mutates the original row after creation.

## 6. Derived JSON shapes and application-owned structure

### Proposal terms

Proposal terms are flexible JSON at the database layer, but runtime code expects an object shape and uses it to generate agreement terms.

### Agreement terms

Generated agreement terms currently follow this shape:

- `parties.investor`: id, name, email.
- `parties.cluster`: id, name, location, region, totalArea, coordinates.
- `lease`: startDate, endDate, durationMonths, cropIntended.
- `financial`: budget, currency.
- `negotiatedTerms`: copied proposal terms.
- `supportingDocuments`: copied proposal documents.

### Agreement clauses

The runtime seeds a standard clause set covering:

- parties
- term
- lease payment
- use of land
- farmer obligations
- termination
- dispute resolution
- digital signatures

These clauses are stored as JSON and are not validated by Prisma beyond being JSON content.

### Notification metadata

Notifications commonly store:

- the related entity id (`proposalId`, `agreementId`, or `receiptId`)
- a deep link `url`

### Audit details

Audit entries store action-specific JSON, such as the state transition target, rejection reason, edited-term flags, or system-trigger metadata.

## 7. Database constraints worth preserving

- `user.email` is unique.
- `session.token` is unique.
- `InvestorProfile.userId`, `FarmerProfile.userId`, and `RepresentativeProfile.userId` are unique to enforce one profile of each kind per user.
- `(clusterId, userId)` is unique in `ClusterFarmer` and `ClusterRepresentative`.
- `Agreement.proposalId` is unique to enforce one agreement per proposal.
- `(agreementId, signerId)` is unique in `AgreementSignature` to block duplicate signatures.
- `EmailLog` has indexes on `recipient`, `status`, and `createdAt` for operational querying.

## 8. Runtime gaps and mismatches to keep in mind

1. `AgreementStatus.PENDING_SIGNATURES` means fully signed but awaiting payment, even though the name suggests the opposite.
2. `ClusterStatus` exists in the schema, but no cluster moderation flow was observed in the server routes inspected for this spec.
3. `UserStatus.SUSPENDED` exists in the schema, but no suspension workflow was observed in the server runtime.
4. Proposal and agreement JSON structures are application-owned; the database does not enforce the nested shapes.
5. Terms edits intentionally clear signatures and revert the agreement to `DRAFT` so both parties must re-sign.

## 9. Operational summary

- Users register, choose a role, and become active through profile setup.
- Investors create and submit proposals against verified or pending clusters.
- Representatives decide proposals, generating agreements when they accept.
- Both sides sign agreements, after which the investor uploads a receipt.
- Verification activates the agreement, and the daily lifecycle job completes it at end date.
- Notifications, audits, and email logs record the cross-cutting history of those actions.
