# Agreement Module Gap Analysis - Implementation Plan

Based on comprehensive doc review vs current implementation.

## ✅ COMPLETED: Cancel Button Fix

**Gap**: Frontend showed cancel to investors/reps, but backend correctly enforces admin-only.  
**Fix**: Changed `canCancel = isAdmin` in agreement-detail-screen.tsx  
**Commit**: `4c91acf`

---

## 🔴 HIGH PRIORITY

### 1. Post-Agreement Resource Suggestions

**Doc Reference**: Section 1.4.2, 3.2, 4.5  
**Requirement**: "Provide post-agreement recommendations for related services, such as local insurance providers, worker unions, and experienced labor groups relevant to the selected crop or region."

**Status**: Not implemented

#### Implementation Plan

**A. Database Schema** ✅ Created migration file
```sql
ResourceSuggestion {
  id, agreementId, category, title, description,
  providerName, contactInfo (JSON), region, cropTypes[],
  estimatedCost, notes, isRecommended, timestamps
}
```

**B. Backend API** (To Do)
- `GET /api/agreements/:id/resources` - List suggestions for an agreement
  - Auto-match by region + crop type
  - Filter by category
  - Prioritize `isRecommended` items
- `POST /api/resources` - Admin creates suggestion (admin-only)
- `PATCH /api/resources/:id` - Admin edits (admin-only)
- `DELETE /api/resources/:id` - Admin deletes (admin-only)

**C. Frontend UI** (To Do)
- New section in `agreement-detail-screen.tsx` below receipts
- Only shows when agreement status is `ACTIVE` or `COMPLETED`
- Categorized cards: Insurance / Labor Unions / Worker Groups / Equipment / Advisory
- Each card shows: title, provider, contact info, estimated cost, description
- "Recommended" badge for curated items
- Admin panel to manage resource library

**D. Seed Data** (To Do)
- Sample insurance providers for Oromia, Amhara, SNNP regions
- Labor unions for wheat, teff, maize crops
- Worker groups with contact info

**E. Notifications** (Optional)
- When agreement activates, send notification: "Your agreement is active. View recommended resources."

---

### 2. Small Digital Payments / Reservation Fees

**Doc Reference**: Section 1.4.2, 3.2  
**Requirement**: "Accept small digital payments (reservation, negotiation fees)" + "Build a hybrid payment management feature"

**Status**: Not implemented (only offline receipt upload exists)

**Doc Acknowledgment**: Section 1.5.2 (Limitations) states "Full payment system integration is out of scope for the MVP" — so this gap has documentation cover.

#### Implementation Plan (If Needed)

**A. Payment Gateway Integration**
- Chapa API (Ethiopian payment gateway) or Stripe
- Environment variables: `CHAPA_SECRET_KEY`, `CHAPA_PUBLIC_KEY`

**B. Database Schema**
```prisma
DigitalPayment {
  id, agreementId, amount, currency, purpose,
  paymentMethod, transactionId, status,
  paidAt, metadata (JSON), timestamps
}
```

**C. Backend API**
- `POST /api/agreements/:id/payments/initiate` - Create payment intent
- `POST /api/agreements/:id/payments/verify` - Webhook handler for payment confirmation
- `GET /api/agreements/:id/payments` - List digital payments

**D. Frontend UI**
- "Pay Reservation Fee" button in agreement detail (if status = DRAFT)
- Payment modal with amount, Chapa/Stripe checkout
- Payment history table

**E. Business Logic**
- Reservation fee: 5-10% of total budget, paid before signing
- Negotiation fee: Small flat fee (e.g., 500 ETB) to submit counter-offer
- Payment verified → unlock next action (signing, etc.)

**Decision**: Defer to post-MVP unless client explicitly requests.

---

## 🟡 MEDIUM PRIORITY

### 3. Print View - Add Term Revision Audit Trail

**Doc Reference**: Section 3.3, 4.10  
**Requirement**: "Store communication logs for transparency and dispute prevention" + "Maintain audit logs for negotiations and agreements"

**Status**: Print view exists but missing revision history appendix

#### Implementation Plan

**A. Backend**
- Audit logs already exist via `logAudit()` in `lib/audit.ts`
- Add query to fetch audit trail for an agreement:
  ```ts
  GET /api/agreements/:id/audit
  // Returns: [{ timestamp, actor, action, details }]
  ```

**B. Frontend Print View**
- Add "Appendix A: Term Revision History" section
- Table: Date | Actor | Action | Changes
- Example row: "2024-05-02 | John Doe (INVESTOR) | TERMS_EDITED | Edited clauses. 2 signatures cleared."

**C. Styling**
- Keep print-friendly serif layout
- Page break before appendix if needed

---

## 🟢 LOW PRIORITY

### 4. "Submitted" Intermediate Payment Status

**Doc Reference**: Section 1.5.1  
**Requirement**: "The payment process is monitored through clear status indicators that reflect each stage, such as pending, submitted, and verified."

**Status**: Current model has PENDING → VERIFIED/REJECTED (2 states). Doc suggests 3 states.

**Analysis**: The doc's "submitted" likely refers to the moment the investor uploads the receipt (currently our `PENDING` state). The distinction between "submitted" and "pending review" is semantic — both mean "rep hasn't looked at it yet."

**Decision**: Current 2-state model is sufficient. If client insists, rename `PENDING` to `SUBMITTED` and add a new `UNDER_REVIEW` state when rep opens the receipt.

---

## Summary Table

| Gap | Priority | Effort | Status |
|---|---|---|---|
| Cancel button visibility | High | 1 line | ✅ Done |
| Post-agreement resources | Medium | 2-3 days | 🔄 Schema ready, API/UI pending |
| Small digital payments | High (deferred) | 1 week | ⏸️ Out of MVP scope per doc |
| Print audit trail | Medium | 4 hours | 📋 Planned |
| "Submitted" status | Low | 2 hours | ⏸️ Not needed |

---

## Next Steps

1. ✅ Commit cancel button fix
2. 🔄 Implement resource suggestions:
   - Run migration
   - Build backend API
   - Create frontend UI
   - Seed sample data
3. 📋 Add audit trail to print view
4. ⏸️ Defer digital payments until client confirms requirement

---

## Files to Create/Modify

**Resource Suggestions Feature**:
- `packages/db/prisma/schema.prisma` - Add ResourceSuggestion model
- `apps/server/src/modules/resources/routes.ts` - New module
- `apps/server/src/modules/resources/service.ts` - Matching logic
- `apps/web/features/agreement/components/resource-suggestions.tsx` - UI component
- `apps/web/features/agreement/datasource/resources.ts` - API client
- `packages/db/prisma/seed.ts` - Sample resource data

**Print Audit Trail**:
- `apps/server/src/modules/agreements/routes.ts` - Add GET /:id/audit
- `apps/web/features/agreement/screens/agreement-print-screen.tsx` - Add appendix section
