"use client";

const KEY = "farmlease.devUserId";
export const DEV_USER_CHANGED_EVENT = "farmlease:dev-user-changed";

export type DevUserRole = "INVESTOR" | "REPRESENTATIVE" | "FARMER" | "ADMIN";

export const DEV_USER_OPTIONS: Array<{
  id: string;
  label: string;
  role: DevUserRole;
}> = [
  { id: "mock-investor-1", label: "Mock Investor", role: "INVESTOR" },
  { id: "mock-rep-1", label: "Bahir Dar Teff Collective", role: "REPRESENTATIVE" },
  { id: "mock-rep-2", label: "Adama Maize Cooperative", role: "REPRESENTATIVE" },
  { id: "mock-rep-3", label: "Hawassa Coffee Group", role: "REPRESENTATIVE" },
  { id: "mock-farmer-1", label: "Mock Farmer", role: "FARMER" },
  { id: "mock-admin-1", label: "Mock Admin", role: "ADMIN" },
];

export function getDevUserId(): string | null {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEV_USER_ID ?? null;
  }
  const fromStorage = window.localStorage.getItem(KEY);
  if (fromStorage) return fromStorage;
  return process.env.NEXT_PUBLIC_DEV_USER_ID ?? null;
}

export function setDevUserId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, id);
  window.dispatchEvent(new CustomEvent(DEV_USER_CHANGED_EVENT, { detail: id }));
}

export function clearDevUserId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(DEV_USER_CHANGED_EVENT, { detail: null }));
}
