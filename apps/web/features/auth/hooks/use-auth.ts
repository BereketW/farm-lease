"use client";

import { useSession } from "../datasource/auth-client";
import { hasRole, hasAnyRole, type Role } from "../entity/auth-helpers";

export function useAuth() {
  const { data: session, isPending, error } = useSession();
  const user = session?.user;

  return {
    user,
    session,
    isLoading: isPending,
    isAuthed: !!user,
    role: user?.role as Role | undefined,
    error,
    isInvestor: hasRole(user, "INVESTOR"),
    isFarmer: hasRole(user, "FARMER"),
    isRepresentative: hasRole(user, "REPRESENTATIVE"),
    isAdmin: hasRole(user, "ADMIN"),
    status: user?.status,
    can: (roles: Role[]) => hasAnyRole(user, roles),
  };
}