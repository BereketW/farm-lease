"use client";

import { cn } from "@farm-lease/ui/lib/utils";

const PALETTE = [
  "bg-emerald-200 text-emerald-900",
  "bg-lime-200 text-lime-900",
  "bg-amber-200 text-amber-900",
  "bg-sky-200 text-sky-900",
  "bg-rose-200 text-rose-900",
  "bg-violet-200 text-violet-900",
];

function hashPick(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function initials(name?: string | null, email?: string | null) {
  const base = name?.trim() || email?.split("@")[0] || "U";
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function NameAvatar({
  name,
  email,
  id,
  size = "md",
  className,
}: {
  name?: string | null;
  email?: string | null;
  id?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes: Record<string, string> = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };
  const tone = hashPick(id || email || name || "U");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white",
        sizes[size],
        tone,
        className
      )}
      aria-hidden
    >
      {initials(name, email)}
    </span>
  );
}
