import Link from "next/link";

export function RepresentativeDashboardContent() {
  return (
    <>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        Representative operations
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-stone-700 dark:text-stone-300">
        Stay on top of cluster requests and keep negotiations moving with investors.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Focus today
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-700 dark:text-stone-300">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span>Prioritize incoming lease proposals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span>Coordinate agreement signing steps with farmer groups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span>Maintain current cluster profile and capacity data</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Quick links
          </h3>
          <div className="mt-3 grid gap-2">
            <Link
              href="/proposals"
              className="inline-flex items-center justify-between rounded-sm border border-emerald-950/10 bg-stone-50 px-3 py-2 text-sm text-stone-800 transition-colors hover:bg-emerald-50 dark:border-emerald-400/15 dark:bg-stone-950/40 dark:text-stone-200 dark:hover:bg-emerald-950/30"
            >
              <span>View incoming proposals</span>
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/agreements"
              className="inline-flex items-center justify-between rounded-sm border border-emerald-950/10 bg-stone-50 px-3 py-2 text-sm text-stone-800 transition-colors hover:bg-emerald-50 dark:border-emerald-400/15 dark:bg-stone-950/40 dark:text-stone-200 dark:hover:bg-emerald-950/30"
            >
              <span>Check active agreements</span>
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/clusters"
              className="inline-flex items-center justify-between rounded-sm border border-emerald-950/10 bg-stone-50 px-3 py-2 text-sm text-stone-800 transition-colors hover:bg-emerald-50 dark:border-emerald-400/15 dark:bg-stone-950/40 dark:text-stone-200 dark:hover:bg-emerald-950/30"
            >
              <span>Update clusters</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
