"use client";

/**
 * RevisionHistory is deprecated. Proposal revisions are no longer a separate
 * entity after the schema v2 migration. Counter-offers now update the
 * proposal's terms inline and append a `NegotiationMessage` with
 * `counterTerms`. This file is kept as an empty shim so callers don't break
 * during incremental refactors.
 */
export function RevisionHistory(_: { revisions?: unknown[] }) {
  return null;
}
