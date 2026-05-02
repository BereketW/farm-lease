"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Handshake,
  LayoutDashboard,
  Plus,
  Settings,
  Users2,
} from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@farm-lease/ui/lib/utils";

type NavItem = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  folio: string; // roman numeral index
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Overview", folio: "i", exact: true },
  { href: "/clusters", icon: Users2, label: "Clusters", folio: "ii" },
  { href: "/proposals", icon: FileText, label: "Proposals", folio: "iii" },
  { href: "/agreements", icon: Handshake, label: "Agreements", folio: "iv" },
];

const FUTURE_ITEMS: Array<{ icon: ComponentType<{ className?: string }>; label: string; folio: string }> = [
  { icon: Settings, label: "Settings", folio: "v" },
];

interface SidebarContentProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarContent({ collapsed, onToggle }: SidebarContentProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    if (href === "/proposals/new") return pathname === "/proposals/new";
    if (href === "/proposals")
      return pathname.startsWith("/proposals") && pathname !== "/proposals/new";
    return pathname.startsWith(href);
  };

  return (
    <div className="relative flex h-full flex-col bg-stone-50/70 text-stone-900 dark:bg-stone-950/80 dark:text-stone-100">
      {/* Paper grain */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 15%, rgba(6,78,59,0.6) 0.5px, transparent 0.5px), radial-gradient(circle at 75% 65%, rgba(6,78,59,0.4) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px, 5px 5px",
        }}
      />

      {/* Brand — publication masthead style */}
      <div
        className={cn(
          "relative flex shrink-0 items-center border-b border-emerald-950/15 dark:border-emerald-400/15",
          collapsed ? "h-16 justify-center px-2" : "h-20 px-4",
        )}
      >
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          {collapsed ? (
            <img
              src="/icon.svg"
              alt="FarmLease"
              className="h-9 w-9 shrink-0 transition-transform group-hover:rotate-[-4deg]"
            />
          ) : (
            <div className="flex min-w-0 flex-col">
              <span
                className="font-mono text-[9px] uppercase tracking-[0.28em] text-emerald-800/70 dark:text-emerald-300/70"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                Vol. I · Est. MMXXV
              </span>
              <span
                className="font-serif text-xl italic leading-tight tracking-tight text-emerald-950 dark:text-emerald-50"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                FarmLease
              </span>
              <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
                A Land Registry
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav — table of contents */}
      <nav className="relative flex-1 overflow-y-auto py-4">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-2 px-4">
            <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
              Table of contents
            </span>
            <span className="h-px flex-1 bg-emerald-950/15 dark:bg-emerald-400/15" />
          </div>
        )}

        <ul className={cn("space-y-0.5", collapsed ? "px-2" : "px-3")}>
          {NAV_ITEMS.map(({ href, icon: Icon, label, folio, exact }) => {
            const active = isActive(href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "group relative flex items-center transition-colors",
                    collapsed
                      ? "h-10 justify-center rounded-sm"
                      : "h-11 gap-3 pl-3 pr-2",
                    !collapsed &&
                      "border-l-2 " +
                        (active
                          ? "border-emerald-800 dark:border-emerald-300"
                          : "border-transparent hover:border-emerald-800/30 dark:hover:border-emerald-300/30"),
                    collapsed && active
                      ? "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                      : "",
                    active
                      ? "text-emerald-950 dark:text-emerald-50"
                      : "text-stone-700 hover:text-emerald-900 dark:text-stone-400 dark:hover:text-emerald-200",
                  )}
                >
                  {!collapsed ? (
                    <span
                      className={cn(
                        "select-none font-serif text-[11px] italic tabular-nums transition-colors",
                        active
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-stone-400 group-hover:text-emerald-700 dark:text-stone-600 dark:group-hover:text-emerald-300",
                      )}
                      style={{ fontFamily: "var(--font-fraunces)" }}
                      aria-hidden
                    >
                      {folio}
                    </span>
                  ) : null}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-stone-500 group-hover:text-emerald-700 dark:text-stone-500 dark:group-hover:text-emerald-300",
                    )}
                  />
                  {!collapsed && (
                    <span
                      className={cn(
                        "flex-1 truncate font-serif text-[15px] leading-none transition-all",
                        active
                          ? "italic font-medium"
                          : "font-normal group-hover:italic",
                      )}
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {label}
                    </span>
                  )}
                  {!collapsed && active ? (
                    <span
                      aria-hidden
                      className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-700/70 dark:text-emerald-300/70"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      ●
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}

          {/* Primary call to action */}
          <li className={cn(!collapsed ? "mt-3 px-0" : "mt-3 px-0")}>
            <Link
              href="/proposals/new"
              title={collapsed ? "New Proposal" : undefined}
              className={cn(
                "group relative flex items-center transition-all",
                collapsed
                  ? "mx-1 h-10 justify-center rounded-sm border border-emerald-900 bg-emerald-900 text-emerald-50 shadow-[2px_2px_0_rgba(6,78,59,0.25)] hover:-translate-y-0.5 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950"
                  : "mx-0 h-11 gap-3 border border-emerald-900 bg-emerald-900 px-3 text-emerald-50 shadow-[3px_3px_0_rgba(6,78,59,0.25)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(6,78,59,0.25)] active:translate-y-0 active:shadow-[1px_1px_0_rgba(6,78,59,0.25)] dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950 dark:shadow-[3px_3px_0_rgba(110,231,183,0.3)]",
              )}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (
                <span
                  className="flex-1 truncate font-serif text-[14px] italic tracking-tight"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  Draft a proposal
                </span>
              )}
              {!collapsed ? (
                <span
                  aria-hidden
                  className="font-mono text-[9px] uppercase tracking-[0.22em] opacity-60"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  new
                </span>
              ) : null}
            </Link>
          </li>
        </ul>

        {/* Future items */}
        <div
          className={cn(
            "mt-6",
            collapsed ? "px-2" : "px-3",
          )}
        >
          {!collapsed && (
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
                Appendix · forthcoming
              </span>
              <span className="h-px flex-1 bg-emerald-950/10 dark:bg-emerald-400/10" />
            </div>
          )}

          <ul className="space-y-0.5">
            {FUTURE_ITEMS.map(({ icon: Icon, label, folio }) => (
              <li key={label}>
                <span
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex h-10 cursor-not-allowed items-center opacity-45",
                    collapsed
                      ? "justify-center rounded-sm"
                      : "gap-3 border-l-2 border-transparent pl-3 pr-2",
                  )}
                >
                  {!collapsed ? (
                    <span
                      className="select-none font-serif text-[11px] italic tabular-nums text-stone-400 dark:text-stone-600"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                      aria-hidden
                    >
                      {folio}
                    </span>
                  ) : null}
                  <Icon className="h-4 w-4 shrink-0 text-stone-500" />
                  {!collapsed && (
                    <span
                      className="flex-1 truncate font-serif text-[15px] italic text-stone-500"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {label}
                    </span>
                  )}
                  {!collapsed ? (
                    <span
                      aria-hidden
                      className="font-mono text-[8px] uppercase tracking-[0.22em] text-stone-400 dark:text-stone-600"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      soon
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Colophon + collapse */}
      <div className="shrink-0 border-t border-emerald-950/15 dark:border-emerald-400/15">
        {!collapsed ? (
          <div className="px-4 pt-3">
            <p
              className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.22em] text-stone-500 dark:text-stone-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Colophon
            </p>
            <p
              className="mt-1 font-serif text-[11px] italic leading-snug text-stone-600 dark:text-stone-400"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Set in Fraunces &amp; Geist. Printed on verified paper.
            </p>
          </div>
        ) : null}

        <div className="p-2">
          <button
            onClick={onToggle}
            className={cn(
              "group flex h-9 w-full items-center border border-transparent text-xs text-stone-600 transition-colors hover:border-emerald-950/10 hover:bg-stone-100/60 hover:text-emerald-900 dark:text-stone-400 dark:hover:border-emerald-400/10 dark:hover:bg-stone-900/40 dark:hover:text-emerald-200",
              collapsed ? "justify-center rounded-sm" : "gap-2 rounded-sm px-3",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.22em]"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  Collapse
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-emerald-950/15 shadow-xl dark:border-emerald-400/15",
          "transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent collapsed={false} onToggle={onToggle} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-emerald-950/15 dark:border-emerald-400/15 lg:flex",
          "transition-all duration-200 ease-in-out",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </aside>
    </>
  );
}
