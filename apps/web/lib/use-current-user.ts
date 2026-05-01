"use client";

import { useEffect, useState } from "react";
import { authClient } from "@farm-lease/auth/client";
import { DEV_USER_CHANGED_EVENT, getDevUserId } from "./dev-user";

export function useCurrentUserId(): string | null {
  const { data } = authClient.useSession();
  const [devId, setDevId] = useState<string | null>(() => getDevUserId());

  useEffect(() => {
    const onChange = () => setDevId(getDevUserId());
    window.addEventListener(DEV_USER_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(DEV_USER_CHANGED_EVENT, onChange);
  }, []);

  if (data?.user?.id) return data.user.id;
  if (process.env.NODE_ENV !== "production") return devId;
  return null;
}

export function useCurrentUser(): { id: string | null; name: string | null } {
  const { data } = authClient.useSession();
  const [devId, setDevId] = useState<string | null>(() => getDevUserId());

  useEffect(() => {
    const onChange = () => setDevId(getDevUserId());
    window.addEventListener(DEV_USER_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(DEV_USER_CHANGED_EVENT, onChange);
  }, []);

  if (data?.user?.id) {
    return { id: data.user.id, name: (data.user as { name?: string | null }).name ?? null };
  }
  if (process.env.NODE_ENV !== "production" && devId) return { id: devId, name: null };
  return { id: null, name: null };
}
