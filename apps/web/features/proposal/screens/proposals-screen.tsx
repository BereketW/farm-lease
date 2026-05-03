"use client";

import Link from "next/link";
import { Feather, Sprout } from "lucide-react";
import { DashboardTabs } from "@/features/proposal/components/dashboard/dashboard-tabs";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  EditorialButton,
  Masthead,
  PaperGrain,
} from "@/components/editorial";
import {
  DashboardContent,
  DashboardHeaderInner,
} from "@/components/layout/dashboard-content";

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
      <PaperGrain />

      <header className="relative border-b border-emerald-950/15 bg-gradient-to-b from-stone-50/90 to-transparent px-6 pb-10 pt-10 dark:border-emerald-400/15 dark:from-stone-950/80 sm:px-10 lg:px-14">
        <DashboardHeaderInner>
          <Masthead
            publication="FarmLease · Proposal Gazette"
            kicker={role.kicker}
            title={role.title}
            lede={lede}
            cta={
              isInvestor ? (
                <Link href="/proposals/new">
                  <EditorialButton variant="primary" size="lg" shimmer>
                    <Feather className="h-3.5 w-3.5" />
                    Draft new proposal
                    <Sprout className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
                  </EditorialButton>
                </Link>
              ) : null
            }
          />
        </DashboardHeaderInner>
      </header>

      <DashboardContent>
        <DashboardTabs />
      </DashboardContent>
    </div>
  );
}
