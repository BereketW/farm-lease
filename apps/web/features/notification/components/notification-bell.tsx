"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@farm-lease/ui/components/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@farm-lease/ui/components/popover";
import { NotificationList } from "./notification-list";
import type { NotificationItemData } from "./notification-item";
import { extractUrl, useNotifications } from "../hooks/use-notifications";
import { cn } from "@farm-lease/ui/lib/utils";

export function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const { query, readOne, readAll } = useNotifications();

    const unreadCount = query.data?.unreadCount ?? 0;
    const notifications = useMemo<NotificationItemData[]>(
        () => query.data?.notifications ?? [],
        [query.data],
    );

    const isUnauthorized =
        query.error instanceof Error &&
        query.error.message.includes("UNAUTHENTICATED");

    const handleSelect = (notification: NotificationItemData) => {
        if (!notification.readAt) {
            readOne.mutate(notification.id);
        }
        const url = extractUrl(notification.data);
        if (url) {
            setOpen(false);
            router.push(url);
        }
    };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-background" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 shadow-xl border-emerald-950/10 dark:border-emerald-400/10">
        <div className="flex items-center justify-between border-b border-emerald-950/10 px-4 py-3 dark:border-emerald-400/10">
          <h3
            className="font-serif italic text-emerald-950 dark:text-emerald-50"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Notifications
          </h3>
          <button
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 transition-colors hover:text-emerald-800 dark:text-stone-400 dark:hover:text-emerald-400"
            disabled={readAll.isPending || unreadCount === 0}
            onClick={() => readAll.mutate()}
          >
            Mark all read
          </button>
        </div>
        <NotificationList
          notifications={notifications}
          isLoading={query.isLoading}
          isUnauthorized={isUnauthorized}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
