import { getDevUserId } from "@/lib/dev-user";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type NotificationType =
  | "PROPOSAL_SUBMITTED"
  | "PROPOSAL_REVISED"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_REJECTED"
  | "PROPOSAL_WITHDRAWN"
  | "NEGOTIATION_MESSAGE"
  | "AGREEMENT_CREATED"
  | "AGREEMENT_SIGNED"
  | "AGREEMENT_ACTIVATED"
  | "AGREEMENT_COMPLETED"
  | "AGREEMENT_CANCELLED"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED"
  | "SYSTEM";

export type NotificationChannel = "IN_APP" | "EMAIL";

type NotificationItem = {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data: unknown;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const devUserId =
    process.env.NODE_ENV !== "production" ? getDevUserId() : null;

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(devUserId ? { "x-dev-user-id": devUserId } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getNotifications() {
  return request<NotificationsResponse>("/api/notifications");
}

export function markNotificationRead(notificationId: string) {
  return request(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return request<void>("/api/notifications/read-all", {
    method: "PATCH",
  });
}
