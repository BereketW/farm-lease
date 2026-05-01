"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DevRoleSwitcher } from "@/components/dev-role-switcher";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/proposals", label: "Proposals" },
  { href: "/proposals/new", label: "New" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100/70 bg-gradient-to-b from-white via-white to-emerald-50/40 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Sprout className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight text-emerald-900">
            FarmLease
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium text-emerald-900/70 transition hover:bg-emerald-100/60 hover:text-emerald-900",
                  active && "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <DevRoleSwitcher />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
