"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { NotificationBell } from "@/features/notification/components/notification-bell";
import { DevRoleSwitcher } from "@/components/dev-role-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const SEGMENT_LABELS: Record<string, string> = {
  proposals: "Proposals",
  new: "New proposal",
  settings: "Settings",
  agreements: "Agreements",
  clusters: "Clusters",
  register: "Register",
};

function getLabel(seg: string): string {
  return SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
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
    const label = /^[0-9a-f-]{8,}$/i.test(seg) ? "Folio" : getLabel(seg);
    crumbs.push({ label, href: path });
  }

  // Today's date strip for editorial flourish
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header
      className={cn(
        "relative flex h-16 shrink-0 items-center gap-4 border-b border-emerald-950/15",
        "bg-stone-50/80 px-4 backdrop-blur-sm",
        "dark:border-emerald-400/15 dark:bg-stone-950/60",
      )}
    >
      {/* Hairline double-rule bottom */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-4px] h-px bg-emerald-950/10 dark:bg-emerald-400/10"
      />

      {/* Mobile hamburger */}
      <button
        type="button"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-emerald-950/10 bg-white/60 text-stone-700 transition-colors hover:border-emerald-800/30 hover:text-emerald-900 dark:border-emerald-400/10 dark:bg-stone-900/40 dark:text-stone-300 dark:hover:text-emerald-200 lg:hidden"
        onClick={onMobileMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb — editorial running head */}
      <nav className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        {/* Date strip */}
        <div className="hidden items-center gap-2 sm:flex">
          <span
            className="font-mono text-[9px] uppercase tracking-[0.28em] text-emerald-800/70 dark:text-emerald-300/70"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {today}
          </span>
          <span
            aria-hidden
            className="font-serif text-[12px] italic leading-none text-stone-400 dark:text-stone-600"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            ❦
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.28em] text-stone-500 dark:text-stone-500"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            The FarmLease Gazette
          </span>
        </div>

        {/* Crumb trail */}
        <div className="flex min-w-0 items-baseline gap-2">
          <Link
            href="/"
            className="shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 transition-colors hover:text-emerald-800 dark:text-stone-500 dark:hover:text-emerald-200"
          >
            Overview
          </Link>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span
                key={crumb.href}
                className="flex min-w-0 items-baseline gap-2"
              >
                <span
                  aria-hidden
                  className="font-serif text-[12px] italic leading-none text-stone-400 dark:text-stone-600"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  /
                </span>
                {isLast ? (
                  <span
                    className="truncate font-serif text-[15px] italic leading-tight text-emerald-950 dark:text-emerald-50"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="truncate font-serif text-[14px] italic leading-tight text-stone-600 transition-colors hover:text-emerald-800 dark:text-stone-400 dark:hover:text-emerald-200"
                    style={{ fontFamily: "var(--font-fraunces)" }}
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </div>
      </nav>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <DevRoleSwitcher />
        {/* Hairline divider between dev + system actions */}
        <span
          aria-hidden
          className="hidden h-6 w-px bg-emerald-950/15 dark:bg-emerald-400/15 sm:block"
        />
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
