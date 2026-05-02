import { apiFetch } from "@/lib/api/client";

export type UserSummary = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export function listUsers(): Promise<{ users: UserSummary[] }> {
  return apiFetch("/api/users");
}

export function updateUserStatus(id: string, status: string): Promise<{ user: UserSummary }> {
  return apiFetch(`/api/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
