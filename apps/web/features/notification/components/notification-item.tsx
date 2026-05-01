"use client";

import { cn } from "@farm-lease/ui/lib/utils";

export type NotificationItemData = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  data: unknown;
};

type NotificationItemProps = {
  notification: NotificationItemData;
  onSelect: (notification: NotificationItemData) => void;
};

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "w-full rounded-md border p-3 text-left transition hover:bg-accent",
        isUnread ? "border-border bg-accent/40" : "border-border"
      )}
    >
      <div className="flex items-start gap-2">
        {isUnread ? (
          <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
        ) : null}
        <div className="flex-1">
          <p className="text-sm font-medium leading-5">{notification.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </button>
  );
}
