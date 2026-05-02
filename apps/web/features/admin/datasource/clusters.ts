import { apiFetch } from "@/lib/api/client";
import type { ClusterSummary } from "@/lib/api/types";

export function decideCluster(
  id: string,
  decision: "VERIFY" | "REJECT",
  reason?: string
): Promise<{ cluster: ClusterSummary }> {
  return apiFetch(`/api/clusters/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, reason }),
  });
}
