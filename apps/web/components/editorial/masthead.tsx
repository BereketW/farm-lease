"use client";

import { HorizonRule } from "./ornament";

/** Editorial page masthead: dated strip, horizon rule, kicker, oversized serif title, lede, CTA slot. */
export function Masthead({
  publication = "FarmLease",
  kicker,
  title,
  italicWord,
  lede,
  cta,
  date,
}: {
  /** Top-left publication name. */
  publication?: string;
  /** Small uppercase kicker above the title. */
  kicker?: string;
  /** Main title. */
  title: string;
  /** If provided, replaces the last word with an italic variant. */
  italicWord?: string;
  /** Serif italic lede paragraph. */
  lede?: string;
  /** Optional CTA node (right-aligned on sm+). */
  cta?: React.ReactNode;
  /** Override date string (defaults to today). */
  date?: string;
}) {
  const dateStr =
    date ??
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const words = title.split(" ");
  const lastWord = italicWord ?? words.pop() ?? "";
  const leading = italicWord ? title : words.join(" ");

  return (
    <header className="relative">
      {/* Top strip */}
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.28em] text-emerald-900/70 dark:text-emerald-300/70">
        <span className="inline-flex items-center gap-2">
          <span className="h-[6px] w-[6px] rotate-45 bg-emerald-800 dark:bg-emerald-400" />
          {publication}
        </span>
        <span
          className="font-mono tracking-[0.18em]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {dateStr}
        </span>
      </div>

      <HorizonRule className="mt-4" />

      <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {kicker ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-emerald-800/80 dark:text-emerald-300/80">
              {kicker}
            </p>
          ) : null}
          <h1
            className="mt-3 font-serif text-5xl font-light leading-[0.95] tracking-tight text-emerald-950 dark:text-emerald-50 sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {leading ? <span>{leading} </span> : null}
            <span className="italic text-emerald-800 dark:text-emerald-300">
              {lastWord}
            </span>
          </h1>
          {lede ? (
            <p className="mt-4 max-w-xl font-serif text-base italic leading-relaxed text-stone-700 dark:text-stone-300">
              {lede}
            </p>
          ) : null}
        </div>

        {cta ? <div className="shrink-0">{cta}</div> : null}
      </div>
    </header>
  );
}

/** Paper-grain background overlay. Place inside a `relative` parent. */
export function PaperGrain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={
        "pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply dark:opacity-[0.08] dark:mix-blend-screen " +
        (className ?? "")
      }
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(40,60,30,0.8) 0.5px, transparent 0.5px)",
        backgroundSize: "4px 4px",
      }}
    />
  );
}
