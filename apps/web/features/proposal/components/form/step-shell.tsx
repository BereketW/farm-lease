"use client";

export function StepShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-emerald-800/80 dark:text-emerald-300/80">
          {eyebrow}
        </p>
        <h2
          className="mt-2 font-serif text-[28px] font-light leading-tight tracking-tight text-emerald-950 dark:text-emerald-50"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          <span className="italic">{title}</span>
        </h2>
        {description ? (
          <p className="mt-2 max-w-xl font-serif text-[14px] italic leading-relaxed text-stone-600 dark:text-stone-400">
            {description}
          </p>
        ) : null}
        <div className="mt-4 flex items-center gap-2" aria-hidden>
          <span className="h-px w-8 bg-emerald-800 dark:bg-emerald-300" />
          <span className="h-1 w-1 rotate-45 bg-emerald-800 dark:bg-emerald-300" />
          <span className="h-px flex-1 bg-emerald-950/10 dark:bg-emerald-400/10" />
        </div>
      </div>
      {children}
    </div>
  );
}
