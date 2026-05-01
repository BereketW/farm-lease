"use client";

import Link from "next/link";
import { ArrowLeft, Quote, Sprout, Star } from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80";

const FRAUNCES = "font-[family-name:var(--font-fraunces)]";

type Props = {
  children: React.ReactNode;
  /** Small eyebrow text above the form */
  eyebrow?: string;
  /** Testimonial / marketing headline shown on the image panel */
  marketingHeadline?: string;
  marketingAccent?: string;
  quote?: string;
  quoteAuthor?: string;
  quoteRole?: string;
};

export function AuthSplit({
  children,
  marketingHeadline = "Grow smarter with",
  marketingAccent = "FarmLease",
  quote = "FarmLease cut our proposal-to-signature cycle from weeks to days. Every step stays transparent to both sides.",
  quoteAuthor = "Abel M.",
  quoteRole = "Investor · Addis Ababa",
}: Props) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: form panel */}
      <div className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        {/* Back to home */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 transition hover:text-emerald-600"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white">
              <Sprout className="h-4 w-4" />
            </span>
            <span className="tracking-tight">FarmLease</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back home
          </Link>
        </div>

        {/* Form slot */}
        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FarmLease · Transparent farmland leasing
        </p>
      </div>

      {/* Right: marketing/image panel */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
          aria-hidden
        />
        {/* Green gradient overlay for readability + brand feel */}
        <div
          className="absolute inset-0 bg-linear-to-br from-emerald-950/80 via-emerald-900/60 to-emerald-950/90"
          aria-hidden
        />

        {/* Soft glow accents */}
        <div
          className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-lime-400/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -right-10 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"
          aria-hidden
        />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-16">
          {/* Top: stats chip */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-100 ring-1 ring-white/20 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Live on FarmLease
            </span>
          </div>

          {/* Middle: marketing headline */}
          <div className="max-w-md text-white">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {marketingHeadline}{" "}
              <span className={`${FRAUNCES} italic font-normal`}>
                {marketingAccent}
              </span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-emerald-100/80">
              Draft proposals, negotiate in real time, and sign agreements — all
              in one transparent workspace for investors and clusters.
            </p>
          </div>

          {/* Bottom: testimonial card */}
          <figure className="max-w-md rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-lg">
            <Quote className="h-5 w-5 text-emerald-300" />
            <blockquote className="mt-3 text-sm leading-relaxed text-white/95">
              “{quote}”
            </blockquote>
            <div className="mt-4 flex items-center justify-between">
              <figcaption className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                  {quoteAuthor.slice(0, 1)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {quoteAuthor}
                  </span>
                  <span className="block text-xs text-emerald-200/80">
                    {quoteRole}
                  </span>
                </span>
              </figcaption>
              <div className="flex items-center gap-0.5 text-amber-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
            </div>
          </figure>
        </div>
      </div>
    </div>
  );
}
