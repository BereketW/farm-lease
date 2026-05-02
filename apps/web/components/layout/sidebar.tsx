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
  Sprout,
  Users2,
} from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Overview", exact: true },
  { href: "/clusters", icon: Users2, label: "Clusters" },
  { href: "/proposals", icon: FileText, label: "Proposals" },
  { href: "/agreements", icon: Handshake, label: "Agreements" },
];

const FUTURE_ITEMS = [
  { icon: Settings, label: "Settings" },
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
    if (href === "/proposals") return pathname.startsWith("/proposals") && pathname !== "/proposals/new";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border/60",
          collapsed ? "justify-center px-3" : "px-4"
        )}
      >
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          {collapsed ? (
            <img src="/icon.svg" alt="FarmLease" className="h-10 w-10 shrink-0" />
          ) : (
            <img src="/icon-full.svg" alt="FarmLease" className="h-10 w-auto" />
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "group flex h-9 items-center gap-3 rounded-r-lg px-2.5 text-sm font-medium transition-all border-l-2",
                    active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-600"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 border-transparent"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                    )}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}

          <li className="pt-1">
                <Link
                  href="/proposals/new"
                  title={collapsed ? "New Proposal" : undefined}
                  className={cn(
                    "group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-all border-l-2 border-transparent",
                    isActive("/proposals/new")
                      ? "bg-emerald-600 text-white shadow-sm !border-emerald-700"
                      : "bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                  )}
                >
              <Plus className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">New Proposal</span>}
            </Link>
          </li>
        </ul>

        <div className="mx-2 my-3 border-t border-border/60" />

        {!collapsed && (
          <p className="mb-1.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Coming soon
          </p>
        )}

        <ul className="space-y-0.5 px-2">
          {FUTURE_ITEMS.map(({ icon: Icon, label }) => (
            <li key={label}>
              <span
                title={collapsed ? label : undefined}
                className={cn(
                  "flex h-9 cursor-not-allowed items-center gap-3 rounded-lg px-2.5 text-sm opacity-35",
                  collapsed ? "justify-center" : ""
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                {!collapsed && (
                  <span className="truncate text-zinc-500">{label}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-border/60 p-2">
        <button
          onClick={onToggle}
          className={cn(
            "flex h-9 w-full items-center rounded-lg text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
            collapsed ? "justify-center" : "gap-2 px-2.5"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-background shadow-xl",
          "transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent collapsed={false} onToggle={onToggle} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 border-r border-border bg-background",
          "transition-all duration-200 ease-in-out",
          collapsed ? "w-14" : "w-60"
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </aside>
    </>
  );
}
