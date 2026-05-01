"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sprout,
  TrendingUp,
  User as UserIcon,
  Users2,
} from "lucide-react";
import { signUp, useSession } from "@/features/auth/datasource/auth-client";
import type { Role } from "@/features/auth/entity/auth-helpers";
import { Input } from "@farm-lease/ui/components/input";
import { Label } from "@farm-lease/ui/components/label";
import { cn } from "@farm-lease/ui/lib/utils";
import { AuthSplit } from "@/features/auth/components/auth-split";

const ROLES: { value: Role; label: string; description: string; icon: typeof TrendingUp }[] = [
  { value: "INVESTOR", label: "Investor", description: "Fund clusters & own proposals", icon: TrendingUp },
  { value: "FARMER", label: "Farmer", description: "Join a cluster with your land", icon: Sprout },
  { value: "REPRESENTATIVE", label: "Representative", description: "Manage a cluster on behalf of farmers", icon: Users2 },
];

export function RegisterScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("INVESTOR");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      router.replace("/proposals");
    }
  }, [session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Role is captured as an additional field by Better Auth
      const result = await signUp.email({ name, email, password, role } as Parameters<typeof signUp.email>[0]);
      if (result.error) {
        setError(result.error.message ?? "Could not create account");
        return;
      }

      // Create the role-specific profile record and mark the user ACTIVE
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";
      const setupRes = await fetch(`${serverUrl}/api/users/setup-profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!setupRes.ok) {
        setError("Account created but role setup failed. Please contact support.");
        return;
      }

      router.push("/proposals");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit
      marketingHeadline="Join the network powering"
      marketingAccent="transparent leasing"
      quote="Getting farmers and investors to agree in the same afternoon used to sound impossible. FarmLease made it ordinary."
      quoteAuthor="Sara K."
      quoteRole="Representative · Hawassa"
    >
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us who you are and we&apos;ll tailor the experience for your
            role.
          </p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="name"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Full name
          </Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Abebe Bikila"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="h-11 pl-10 text-sm"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 pl-10 text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-11 pl-10 pr-10 text-sm"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        {/* Role picker */}
        <div className="space-y-2 pt-1">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            I am a…
          </Label>
          <div className="grid gap-2">
            {ROLES.map(({ value, label, description, icon: Icon }) => {
              const selected = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all",
                    selected
                      ? "border-emerald-600 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-500/20 dark:bg-emerald-950/30"
                      : "border-border bg-background hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm dark:hover:border-emerald-900/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform",
                      selected
                        ? "bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        : "bg-muted text-muted-foreground group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/40"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                  <div
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border transition",
                      selected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-border bg-background text-transparent"
                    )}
                  >
                    <Check className="size-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-linear-to-r from-emerald-600 to-emerald-700 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-emerald-500/25 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Create account
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="#" className="underline hover:text-emerald-700">Terms</a> and{" "}
          <a href="#" className="underline hover:text-emerald-700">Privacy Policy</a>.
        </p>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}

/* -------------------------- Password strength ------------------------------ */

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    /.{8,}/.test(password),
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-rose-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-lime-500",
    "bg-emerald-600",
  ];
  return (
    <div className="pt-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? colors[score] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Strength:{" "}
        <span className="font-medium text-foreground">{labels[score]}</span>
      </p>
    </div>
  );
}
