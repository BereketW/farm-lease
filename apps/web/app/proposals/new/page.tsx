import { ProposalForm } from "@/components/proposals/form/proposal-form";

export default function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ clusterId?: string }>;
}) {
  return <NewProposalContent searchParamsPromise={searchParams} />;
}

async function NewProposalContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ clusterId?: string }>;
}) {
  const { clusterId } = await searchParamsPromise;
  return (
    <div className="flex flex-1 justify-center bg-gradient-to-b from-emerald-50/30 to-white dark:from-zinc-950 dark:to-zinc-950 px-4 py-8">
      <div className="w-full max-w-5xl">
        <header className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-500">
            FarmLease · Proposal builder
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-100">
            Draft a new lease proposal
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Five quick steps. Save the headline numbers, attach context, and send it to
            a verified cluster representative.
          </p>
        </header>
        <ProposalForm defaultClusterId={clusterId} />
      </div>
    </div>
  );
}
