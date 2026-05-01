"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@farm-lease/ui/components/button";
import { cn } from "@farm-lease/ui/lib/utils";
import { NotificationBell } from "@/features/notification/components/notification-bell";
import { DevRoleSwitcher } from "@/components/dev-role-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const SEGMENT_LABELS: Record<string, string> = {
  proposals: "Proposals",
  new: "New Proposal",
  settings: "Settings",
  agreements: "Agreements",
  clusters: "Clusters",
};

function getLabel(seg: string): string {
  return (
    SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
  );
}

export function Topbar({
  onMobileMenuClick,
}: {
  onMobileMenuClick: () => void;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = /^[0-9a-f-]{8,}$/i.test(seg) ? "Detail" : getLabel(seg);
    crumbs.push({ label, href: path });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200/60 bg-background/80 px-4 backdrop-blur-sm dark:border-zinc-800">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onMobileMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Breadcrumb */}
      <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm">
        <span className="text-muted-foreground">Overview</span>
        {crumbs.map((crumb, i) => (
          <span
            key={crumb.href}
            className="flex min-w-0 items-center gap-1"
          >
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            <span
              className={cn(
                "truncate",
                i === crumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <DevRoleSwitcher />
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
