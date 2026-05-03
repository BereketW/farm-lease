"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardContent } from "@/components/layout/dashboard-content";
import { Masthead, PaperGrain } from "@/components/editorial";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { RegisterClusterForm } from "../components/register-cluster-form";

export function RegisterClusterScreen() {
  const router = useRouter();
  const { isLoading, isAuthed, role } = useAuth();

  const allowed = role === "REPRESENTATIVE" || role === "FARMER";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthed) router.replace("/login");
    else if (!allowed) router.replace("/clusters");
  }, [isLoading, isAuthed, allowed, router]);

  if (isLoading || !isAuthed || !allowed) {
    return (
      <div className="flex flex-1 items-center justify-center bg-stone-50/60 py-24 dark:bg-stone-950/60">
        <Loader2 className="size-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <PaperGrain />
      <DashboardContent>
        <div className="space-y-8">
          <Masthead
            kicker="Cluster Registry"
            title="Register a cluster"
            italicWord="cluster"
            lede="Submit a government-recognized farming cluster — its identity, geography, membership, and land documentation — for verification."
          />
          <RegisterClusterForm />
        </div>
      </DashboardContent>
    </div>
  );
}
