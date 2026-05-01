"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { getSocket, resetSocket } from "@/lib/socket";
import { markNotificationRead } from "@/lib/notifications";
import { useCurrentUserId } from "@/lib/use-current-user";

type NotificationPayload = {
  id?: string;
  title?: string;
  body?: string;
  type?: string;
  data?: unknown;
};

function extractUrl(data: unknown): string | undefined {
  if (data && typeof data === "object" && "url" in data) {
    const url = (data as { url?: unknown }).url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  return undefined;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof Error && /^4\d\d/.test(error.message)) return false;
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeBridge />
      {children}
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}

function RealtimeBridge() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const effectiveUserId = useCurrentUserId();

  useEffect(() => {
    if (!effectiveUserId) {
      resetSocket();
      return;
    }

    // Ensure a fresh socket carries the latest user id in its handshake auth.
    resetSocket();
    const socket = getSocket();

    const onConnectError = () => {
      // avoid noisy logs in dev while auth bootstraps
    };

    const onNotification = (payload: NotificationPayload) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });

      const url = extractUrl(payload.data);
      toast(payload.title ?? "Notification", {
        description: payload.body ?? payload.type ?? "You have a new update.",
        action: url
          ? {
              label: "Open",
              onClick: () => {
                if (payload.id) {
                  void markNotificationRead(payload.id).catch(() => undefined);
                }
                router.push(url);
              },
            }
          : undefined,
      });
    };

    socket.on("connect_error", onConnectError);
    socket.on("notification:new", onNotification);
    socket.connect();

    return () => {
      socket.off("connect_error", onConnectError);
      socket.off("notification:new", onNotification);
      socket.disconnect();
    };
  }, [effectiveUserId, queryClient, router]);

  return null;
}
