import { apiFetch } from "@/lib/api/client";

export type UserSummary = {
  id: string;
  name: string | null;
  email: string;
  role: "INVESTOR" | "FARMER" | "REPRESENTATIVE" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  createdAt: string;
  lastLoginAt: string | null;
};

export type UserAuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: unknown;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    role: "INVESTOR" | "FARMER" | "REPRESENTATIVE" | "ADMIN";
    email: string;
  };
};

export function listUsers(): Promise<{ users: UserSummary[] }> {
  return apiFetch("/api/users");
}

export function updateUserStatus(
  id: string,
  status: UserSummary["status"]
): Promise<{ user: UserSummary }> {
  return apiFetch(`/api/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateUserRole(
  id: string,
  role: UserSummary["role"]
): Promise<{ user: UserSummary }> {
  return apiFetch(`/api/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function promoteToAdmin(id: string): Promise<{ user: UserSummary }> {
  return apiFetch(`/api/users/${id}/promote-admin`, {
    method: "POST",
  });
}

export function getUserAuditLogs(id: string): Promise<{ logs: UserAuditLog[] }> {
  return apiFetch(`/api/users/${encodeURIComponent(id)}/audit`);
}
