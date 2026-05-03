"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
// import { UserManagementScreen } from "@/features/admin/screens/user-management-screen";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { UserManagementScreen } from "@/features/admin/screens/user-management-screen";

export default function UserManagementPage() {
  const router = useRouter();
  const { isLoading, isAuthed, isAdmin } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthed) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/proposals");
    }
  }, [isLoading, isAuthed, isAdmin, router]);

  if (isLoading || !isAuthed || !isAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Checking access…</div>;
  }

  return <UserManagementScreen />;
}
