"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import { type Role, ROLE_HOME } from "../entity/auth-helpers";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, isLoading, can } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !can(allowedRoles)) {
      router.push(ROLE_HOME[(user as { role: Role }).role] ?? "/");
    }
  }, [isLoading, user, allowedRoles, can, router]);

  if (isLoading) return <div className="animate-pulse text-sm text-muted-foreground p-4">Loading…</div>;
  if (!user) return null;
  if (!can(allowedRoles)) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
