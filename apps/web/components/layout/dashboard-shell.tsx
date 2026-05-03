"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { StatusBanner } from "./status-banner";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isPrintPage = pathname.endsWith("/print");
  const isLandingPage = pathname === "/";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar:collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar:collapsed", String(next));
  };

  if (isAuthPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (isPrintPage) {
    return <div className="min-h-screen bg-zinc-100">{children}</div>;
  }

  if (isLandingPage) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMobileMenuClick={() => setMobileOpen(true)} />
        <StatusBanner />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
