"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Badge } from "@farm-lease/ui/components/badge";
import { Button } from "@farm-lease/ui/components/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@farm-lease/ui/components/popover";
import { Separator } from "@farm-lease/ui/components/separator";
import { NotificationList } from "./notification-list";
import type { NotificationItemData } from "./notification-item";
import { extractUrl, useNotifications } from "../hooks/use-notifications";

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
                    variant="outline"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 ? (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[360px] p-3 bg-background">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={readAll.isPending || unreadCount === 0}
                        onClick={() => readAll.mutate()}
                    >
                        Mark all as read
                    </Button>
                </div>
                <Separator className="my-2" />
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
