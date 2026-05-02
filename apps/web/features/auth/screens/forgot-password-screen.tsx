"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Input } from "@farm-lease/ui/components/input";
import { Label } from "@farm-lease/ui/components/label";
import { AuthSplit } from "@/features/auth/components/auth-split";
// import { forgetPassword } from "@/features/auth/datasource/auth-client"; // Uncomment once fixed

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // await forgetPassword({ email }); // Uncomment once fixed
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit>
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            Check your email for a password reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
                  className="h-11 pl-10 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-linear-to-r from-emerald-600 to-emerald-700 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-emerald-500/25 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-muted-foreground text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:underline">
            <ArrowLeft className="size-3.5" />
            Back to login
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
