import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProposalForm } from "@/features/proposal/components/form/proposal-form";


export async function NewProposalScreen({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ clusterId?: string }>;
}) {
  const { clusterId } = await searchParamsPromise;
  return (
    <div className="relative flex flex-1 justify-center bg-stone-50/60 px-4 py-10 dark:bg-stone-950/60 sm:px-8">
      <div className="relative w-full max-w-5xl">
        <Link
          href="/proposals"
          className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-800/80 transition-colors hover:text-emerald-900 dark:text-emerald-300/80 dark:hover:text-emerald-200"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to the Ledger
        </Link>

        <div className="mt-5 border-b border-emerald-950/15 pb-8 dark:border-emerald-400/15">
          <h1 className="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
            Compose a{" "}
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
              lease proposal
            </span>
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Five unhurried steps. Set the headline numbers, attach the context, and send it along to a verified cluster representative.
          </p>
        </div>

        <div className="mt-10">
          <ProposalForm defaultClusterId={clusterId} />
        </div>
      </div>
    </div>
  );
}
