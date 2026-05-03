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

function relativeTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-all hover:bg-stone-50 dark:hover:bg-stone-900/50",
        isUnread && "bg-emerald-50/50 dark:bg-emerald-950/20"
      )}
    >
      <div className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", isUnread ? "bg-emerald-600" : "bg-transparent")} />
      
      <div className="flex-1 min-w-0">
        <p className="font-serif text-[13px] font-medium leading-snug tracking-tight text-emerald-950 dark:text-emerald-50">
          {notification.title}
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-stone-600 dark:text-stone-400">
          {notification.body}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-400 dark:text-stone-600">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
