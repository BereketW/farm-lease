"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Facebook,
  Instagram,
  Linkedin,
  Play,
  Sprout,
  Star,
  Twitter,
} from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { useInView } from "@/lib/use-in-view";

/* ------------------------------- Reveal ---------------------------------- */

function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "span" | "li" | "h2";
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        inView
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0",
        className
      )}
    >
      {children}
    </Tag>
  );
}

const HERO_IMG =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80";
const FEATURE_IMG =
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80";
const CARD_IMG_1 =
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80";
const CARD_IMG_2 =
  "https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b2e?auto=format&fit=crop&w=900&q=80";
const CARD_IMG_3 =
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80";
const TESTIMONIAL_BG =
  "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=2000&q=80";
const DEVICE_IMG =
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1000&q=80";

const FRAUNCES = "font-[family-name:var(--font-fraunces)]";

export default function Home() {
  return (
    <main className="bg-white text-zinc-900">
      <StickyNav />
      <Hero />
      <StatsBand />
      <PartnersStrip />
      <FeatureSplit />
      <PreferredPlatform />
      <Testimonial />
      <ReportsChecklist />
      <NewsletterCta />
      <Footer />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    HERO                                    */
/* -------------------------------------------------------------------------- */

function StickyNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex justify-center px-4 transition-all duration-300",
        scrolled ? "pt-3" : "pt-6"
      )}
    >
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-full px-2 py-2 transition-all duration-300",
          scrolled
            ? "bg-white/95 shadow-lg ring-1 ring-zinc-200/80 backdrop-blur-md"
            : "bg-white/90 shadow-md ring-1 ring-white/30 backdrop-blur"
        )}
      >
        <Link href="/" className="flex items-center gap-2 pl-3 pr-4">
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white">
            <Sprout className="h-4 w-4" />
            <span className="absolute -inset-1 animate-ping rounded-full bg-emerald-400/30" />
          </span>
          <span className="text-base font-semibold tracking-tight text-emerald-950">
            FarmLease
          </span>
        </Link>

        <ul className="hidden items-center gap-8 text-sm font-medium text-zinc-700 md:flex">
          {[
            { href: "#features", label: "Features" },
            { href: "#reports", label: "Capabilities" },
            { href: "#testimonials", label: "Partners" },
            { href: "#contact", label: "Contact" },
          ].map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="relative inline-block py-1 transition hover:text-emerald-700 after:absolute after:inset-x-1 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-emerald-600 after:transition-transform hover:after:scale-x-100"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition hover:text-emerald-700 sm:inline-block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:shadow-md"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[780px] overflow-hidden bg-emerald-950">
      {/* background image with slow zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center motion-safe:animate-[heroZoom_20s_ease-out_forwards]"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-linear-to-b from-emerald-950/60 via-emerald-950/40 to-emerald-950/90"
        aria-hidden
      />

      {/* decorative glow */}
      <div
        className="absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-lime-400/10 blur-3xl"
        aria-hidden
      />

      {/* Hero content */}
      <div className="relative z-10 mx-auto flex min-h-[780px] max-w-6xl flex-col justify-between px-6 pb-16 pt-40 md:pt-48">
        {/* Top-right floating blurb card */}
        <Reveal delay={400} className="ml-auto max-w-xs">
          <div className="hidden rounded-2xl bg-white/90 p-4 text-sm text-zinc-700 shadow-xl backdrop-blur md:block">
            <p className="leading-relaxed">
              Trusted by cluster representatives and investors across Ethiopia
              to transparently lease, negotiate, and activate farmland
              agreements.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                FL
              </span>
              <span className="text-xs font-semibold text-emerald-900">
                FarmLease Team
              </span>
            </div>
          </div>
        </Reveal>

        {/* Big heading */}
        <div className="max-w-4xl text-white">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-emerald-100 ring-1 ring-white/20 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Live on FarmLease
            </span>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              The Most{" "}
              <span
                className={`${FRAUNCES} italic font-normal underline decoration-white/60 decoration-[3px] underline-offset-10`}
              >
                Trusted
              </span>{" "}
              Farmland Leasing Platform For Investors &amp; Clusters
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/proposals"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 hover:shadow-lg"
              >
                Browse clusters
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Become a partner
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 STATS BAND                                 */
/* -------------------------------------------------------------------------- */

function StatsBand() {
  const stats = [
    { value: "120+", label: "Active Clusters" },
    { value: "4.8★", label: "Partner Rating" },
    { value: "1.2k+", label: "Proposals Closed" },
    { value: "38,000+", label: "Acres Under Lease" },
  ];
  return (
    <section className="border-b border-zinc-100 bg-[#f6f3ec]">
      <div className="mx-auto max-w-5xl px-6 py-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-emerald-950 md:text-4xl">
            <span className={`${FRAUNCES} italic font-normal`}>
              Revolutionizing
            </span>{" "}
            Agriculture with Transparent Leasing and Scale — Empowering Farmers
            &amp; Investors Worldwide.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div className="text-4xl font-semibold tracking-tight text-emerald-950">
                {s.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                               PARTNERS STRIP                               */
/* -------------------------------------------------------------------------- */

function PartnersStrip() {
  const partners = [
    "Bahir Dar Teff Collective",
    "Adama Maize Cooperative",
    "Hawassa Coffee Group",
    "Mekelle Grains Union",
    "Jimma Spice Cluster",
    "Arsi Wheat Co-op",
  ];
  return (
    <section className="border-b border-zinc-100 bg-white py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Our Partners
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((p) => (
            <span
              key={p}
              className="text-sm font-medium text-zinc-400 transition hover:text-zinc-600"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                FEATURE SPLIT                               */
/* -------------------------------------------------------------------------- */

function FeatureSplit() {
  const items = [
    "Structured proposal drafts",
    "Iterative negotiation with counter-offers",
    "Secure document attachments",
    "Automatic agreement generation",
  ];
  return (
    <section id="features" className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2">
        <Reveal>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-emerald-950 md:text-5xl">
            Comprehensive{" "}
            <span className={`${FRAUNCES} italic font-normal`}>
              Proposal Management
            </span>{" "}
            and Negotiation Solutions
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-600">
            Draft, submit, negotiate, and activate farmland lease agreements in
            one transparent workspace — purpose-built for investors and cluster
            representatives.
          </p>
          <ul className="mt-8 space-y-3">
            {items.map((text, i) => (
              <li
                key={text}
                style={{ transitionDelay: `${i * 80}ms` }}
                className="flex items-start gap-3 text-sm text-zinc-700"
              >
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-3 w-3" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Right: video-style image with play button */}
        <Reveal delay={150} className="relative overflow-hidden rounded-3xl bg-emerald-900 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FEATURE_IMG}
            alt="Farmland aerial"
            className="h-full w-full object-cover opacity-90"
          />
          <button
            type="button"
            aria-label="Play introduction"
            className="absolute inset-0 grid place-items-center transition hover:bg-black/10"
          >
            <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white/90 text-emerald-700 shadow-lg backdrop-blur transition hover:scale-105">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
              <Play className="relative h-6 w-6 fill-current" />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                            CUSTOMER-PREFERRED                              */
/* -------------------------------------------------------------------------- */

function PreferredPlatform() {
  const cards = [
    {
      img: CARD_IMG_1,
      tag: "For Investors",
      title: "Discover &amp; fund clusters",
    },
    {
      img: CARD_IMG_2,
      tag: "For Representatives",
      title: "Manage your cluster",
    },
    {
      img: CARD_IMG_3,
      tag: "For Farmers",
      title: "See the impact",
    },
  ];
  return (
    <section className="bg-[#f6f3ec] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-emerald-950 md:text-5xl">
            Customer-
            <span className={`${FRAUNCES} italic font-normal`}>Preferred</span>{" "}
            Platform
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal
              key={c.tag}
              delay={i * 120}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-4/3 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={c.tag}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">
                  {c.tag}
                </p>
                <p
                  className="mt-2 text-lg font-semibold text-emerald-950"
                  dangerouslySetInnerHTML={{ __html: c.title }}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                TESTIMONIAL                                 */
/* -------------------------------------------------------------------------- */

function Testimonial() {
  return (
    <section id="testimonials" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-emerald-950 md:text-5xl">
            What Our <span className={`${FRAUNCES} italic font-normal`}>Clients</span> Say
          </h2>
        </Reveal>
      </div>

      <div className="relative mt-12 h-[420px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${TESTIMONIAL_BG})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-emerald-950/40" aria-hidden />

        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <Reveal>
            <figure className="max-w-md rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur">
              <div className="flex items-center gap-0.5 text-amber-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-zinc-800">
                “FarmLease cut our proposal-to-signature cycle from weeks to days.
                The negotiation chat and digital signing made every step
                transparent to both sides of the table.”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                  AM
                </span>
                <span>
                  <span className="block text-sm font-semibold text-emerald-950">
                    Abel M.
                  </span>
                  <span className="block text-xs text-zinc-500">
                    Investor · Addis Ababa
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             REPORTS CHECKLIST                              */
/* -------------------------------------------------------------------------- */

function ReportsChecklist() {
  const items = [
    "Proposal Drafts",
    "Counter-offer Negotiation",
    "Document Uploads",
    "Digital Signatures",
    "Payment Verification",
    "Cluster Discovery",
    "Agreement Generation",
    "Contract Repository",
    "Audit Trails",
  ];
  const highlighted = "Digital Signatures";
  return (
    <section id="reports" className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <Reveal>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-emerald-950 md:text-5xl">
            What Leasing{" "}
            <span className={`${FRAUNCES} italic font-normal`}>Capabilities</span>{" "}
            Do You Need?
          </h2>
          <ul className="mt-10 space-y-4">
            {items.map((item) => {
              const isHighlight = item === highlighted;
              return (
                <li
                  key={item}
                  className={
                    isHighlight
                      ? "relative flex items-center gap-3 rounded-full bg-linear-to-r from-emerald-500 to-lime-400 px-5 py-3 text-sm font-semibold text-white shadow-md"
                      : "flex items-center gap-3 px-5 py-2 text-sm text-zinc-700"
                  }
                >
                  <span
                    className={
                      isHighlight
                        ? "grid h-5 w-5 place-items-center rounded-full bg-white text-emerald-600"
                        : "grid h-5 w-5 place-items-center rounded-full border border-emerald-600 text-emerald-600"
                    }
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={150} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DEVICE_IMG}
            alt="FarmLease device preview"
            className="w-full rounded-3xl shadow-2xl"
          />
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-4 shadow-xl ring-1 ring-zinc-100 md:block">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white">
                <Sprout className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Live negotiation
                </p>
                <p className="text-sm font-semibold text-emerald-950">
                  Proposal updated
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              NEWSLETTER CTA                                */
/* -------------------------------------------------------------------------- */

function NewsletterCta() {
  return (
    <section id="contact" className="relative overflow-hidden bg-emerald-900">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
          Follow <span className={`${FRAUNCES} italic font-normal`}>FarmLease</span>
        </h2>
        <p className="mt-3 text-sm text-emerald-100/80">
          Get product updates and cluster opportunities straight to your inbox.
        </p>

        <form
          className="mx-auto mt-8 flex max-w-md items-center gap-1 rounded-full bg-white p-1.5 shadow-xl"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            required
            placeholder="Enter your email"
            className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-linear-to-r from-emerald-500 to-lime-400 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   FOOTER                                   */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="bg-zinc-950 py-20 text-zinc-300">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h3 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Grow{" "}
              <span className={`${FRAUNCES} italic font-normal`}>
                Smarter
              </span>
              <br />
              With FarmLease
            </h3>
            <p className="mt-4 max-w-md text-sm text-zinc-400">
              Transparent proposals. Real-time negotiation. Signed, activated
              agreements — all in one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-zinc-500 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} FarmLease. All rights reserved.</p>
          <ul className="flex gap-6">
            <li><a href="#" className="hover:text-emerald-400">Privacy</a></li>
            <li><a href="#" className="hover:text-emerald-400">Terms</a></li>
            <li><a href="#" className="hover:text-emerald-400">Contact</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
