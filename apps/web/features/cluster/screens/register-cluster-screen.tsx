import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegisterClusterForm } from "@/features/cluster/components/register-cluster-form";
import { Masthead, PaperGrain } from "@/components/editorial";

export function RegisterClusterScreen() {
  return (
    <div className="relative flex flex-1 justify-center bg-stone-50/60 px-4 py-10 dark:bg-stone-950/60 sm:px-8">
      <PaperGrain />
      <div className="relative w-full max-w-4xl">
        <Link
          href="/clusters"
          className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-800/80 transition-colors hover:text-emerald-900 dark:text-emerald-300/80 dark:hover:text-emerald-200"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to the Registry
        </Link>

        <div className="mt-5">
          <Masthead
            publication="FarmLease · Land Registry"
            kicker="A new registration"
            title="Register a cluster"
            italicWord="cluster"
            lede="Provide the details of your farming cluster — location, crops, and the farmers who tend it — to begin the verification process."
          />
        </div>

        <div className="mt-10">
          <RegisterClusterForm />
        </div>
      </div>
    </div>
  );
}
