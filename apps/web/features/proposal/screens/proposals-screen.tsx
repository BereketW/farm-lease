"use client";

import Link from "next/link";
import { Feather, Sprout } from "lucide-react";
import { DashboardTabs } from "@/features/proposal/components/dashboard/dashboard-tabs";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@farm-lease/ui/components/button";

export function ProposalsScreen() {
  const { isInvestor, isAdmin, isRepresentative } = useAuth();

  const role = isAdmin
    ? { kicker: "Global oversight", title: "All proposals" }
    : isRepresentative
    ? { kicker: "Cluster desk", title: "Incoming proposals" }
    : { kicker: "Investor desk", title: "Your proposals" };

  const lede = isAdmin
    ? "Every negotiation, from first whisper to final signature, watched over across the platform."
    : isRepresentative
    ? "Review incoming lease drafts and negotiate terms on behalf of the clusters you represent."
    : "Active negotiations, incoming drafts, and finalised terms — everything you've set in motion.";

  const titleParts = role.title.split(" ");
  const firstWord = titleParts[0];
  const restOfTitle = titleParts.slice(1).join(" ");

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <header className="border-b border-emerald-950/15 bg-white px-6 py-8 dark:border-emerald-400/15 dark:bg-stone-950 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
              {firstWord}{" "}
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                {restOfTitle}
              </span>
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {lede}
            </p>
          </div>
          {isInvestor && (
            <div className="flex items-center gap-3">
              <Link href="/proposals/new">
                <Button className="gap-2 bg-emerald-800 dark:bg-emerald-300 text-white dark:text-black">
                  <Feather className="h-4 w-4" />
                  Draft new proposal
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-10 lg:px-14">
        <DashboardTabs />
      </main>
    </div>
  );
}
