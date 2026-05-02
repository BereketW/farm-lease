"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardTabs } from "@/features/proposal/components/dashboard/dashboard-tabs";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function ProposalsScreen() {
  const { isInvestor, isAdmin, isRepresentative } = useAuth();

  return (
    <div className="flex flex-1 flex-col bg-background/50">
      {/* Premium Header */}
      <div className="relative border-b border-border/40 bg-card/50 px-6 py-10 sm:px-10 lg:px-12 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-lime-500/5 dark:from-emerald-950/50 dark:to-lime-950/20" />
        
        <div className="relative mx-auto w-full max-w-[1600px]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/50 bg-emerald-50/50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 backdrop-blur-sm dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                {isAdmin ? "Global Oversight" : "Active Workspace"}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {isAdmin ? "All Proposals" : "Proposals"}
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground">
                {isAdmin
                  ? "Monitor all lease negotiations and agreements across the entire platform."
                  : isRepresentative
                    ? "Review incoming lease drafts and negotiate terms on behalf of your clusters."
                    : "Manage your active negotiations, review incoming drafts, and finalize terms to secure farmland."}
              </p>
            </div>
            
            {isInvestor && (
              <div className="shrink-0">
                <Link
                  href="/proposals/new"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30"
                >
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                    <div className="relative h-full w-8 bg-white/20" />
                  </div>
                  <Plus className="h-4 w-4" />
                  Draft New Proposal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[1600px] px-6 py-8 sm:px-10 lg:px-12">
        <DashboardTabs />
      </div>
    </div>
  );
}
