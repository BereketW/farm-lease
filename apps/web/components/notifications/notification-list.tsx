"use client";

import { ScrollArea } from "@farm-lease/ui/components/scroll-area";
import { NotificationItem, type NotificationItemData } from "./notification-item";

type NotificationListProps = {
  notifications: NotificationItemData[];
  isLoading: boolean;
  isUnauthorized: boolean;
  onSelect: (notification: NotificationItemData) => void;
};

export function NotificationList({
  notifications,
  isLoading,
  isUnauthorized,
  onSelect,
}: NotificationListProps) {
  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>;
  }

  if (isUnauthorized) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Sign in to view notifications.
      </p>
    );
  }

  if (notifications.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No notifications yet.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[320px] pr-2">
      <ul className="space-y-2">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <NotificationItem notification={notification} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
