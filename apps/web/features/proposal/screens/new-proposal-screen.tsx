import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProposalForm } from "@/features/proposal/components/form/proposal-form";
import { Masthead, PaperGrain } from "@/components/editorial";

export async function NewProposalScreen({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ clusterId?: string }>;
}) {
  const { clusterId } = await searchParamsPromise;
  return (
    <div className="relative flex flex-1 justify-center bg-stone-50/60 px-4 py-10 dark:bg-stone-950/60 sm:px-8">
      <PaperGrain />
      <div className="relative w-full max-w-5xl">
        <Link
          href="/proposals"
          className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-800/80 transition-colors hover:text-emerald-900 dark:text-emerald-300/80 dark:hover:text-emerald-200"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to the Ledger
        </Link>

        <div className="mt-5">
          <Masthead
            publication="FarmLease · Proposal Composer"
            kicker="A new draft"
            title="Compose a lease proposal"
            italicWord="lease proposal"
            lede="Five unhurried steps. Set the headline numbers, attach the context, and send it along to a verified cluster representative."
          />
        </div>

        <div className="mt-10">
          <ProposalForm defaultClusterId={clusterId} />
        </div>
      </div>
    </div>
  );
}
