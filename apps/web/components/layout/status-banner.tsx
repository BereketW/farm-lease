"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@farm-lease/ui/lib/utils";

export function StatusBanner() {
  const { status, isLoading } = useAuth();

  if (isLoading || !status || status === "ACTIVE") return null;

  const config = {
    PENDING: {
      title: "Account pending verification",
      message: "Your registration is being reviewed by our administration. You will have full access once approved.",
      icon: Clock,
      className: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
    },
    SUSPENDED: {
      title: "Account suspended",
      message: "Your account has been suspended. Please contact support for further assistance.",
      icon: AlertTriangle,
      className: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200",
    },
  };

  const meta = config[status as keyof typeof config];
  if (!meta) return null;

  return (
    <div className={cn("flex items-center gap-3 border-b px-6 py-3 text-sm", meta.className)}>
      <meta.icon className="size-4 shrink-0" />
      <div>
        <p className="font-semibold">{meta.title}</p>
        <p className="text-xs opacity-90">{meta.message}</p>
      </div>
    </div>
  );
}
