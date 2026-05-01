"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export const notificationsQueryKey = ["notifications"] as const;

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: getNotifications,
    retry: false,
    refetchInterval: 20_000,
  });

  const readOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });

  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });

  useEffect(() => {
    const socket = getSocket();
    const onNotification = () => {
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    };
    socket.on("notification:new", onNotification);
    return () => {
      socket.off("notification:new", onNotification);
    };
  }, [queryClient]);

  return { query, readOne, readAll };
}

export function extractUrl(data: unknown): string | undefined {
  if (data && typeof data === "object" && "url" in data) {
    const url = (data as { url?: unknown }).url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  return undefined;
}
