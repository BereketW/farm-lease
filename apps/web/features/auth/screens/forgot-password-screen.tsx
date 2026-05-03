"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@farm-lease/ui/components/input";
import { Label } from "@farm-lease/ui/components/label";
import { AuthSplit } from "@/features/auth/components/auth-split";
import { emailOtp } from "@/features/auth/datasource/auth-client";
import { cn } from "@farm-lease/ui/lib/utils";

type Step = "request" | "verify" | "reset";

export function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await emailOtp.requestPasswordReset({ email });
      setStep("verify");
      toast.success("OTP sent to your email.");
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await emailOtp.checkVerificationOtp({ email, otp, type: "forget-password" });
      setStep("reset");
    } catch (error) {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await emailOtp.resetPassword({ email, otp, password });
      toast.success("Password reset successfully.");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit>
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="font-serif text-3xl italic tracking-tight text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>
            {step === "request" ? "Reset password" : step === "verify" ? "Verify OTP" : "New password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "request" ? "Enter your email to receive an OTP." : step === "verify" ? "Enter the 6-digit code sent to your email." : "Set a new secure password."}
          </p>
        </div>

        {step === "request" && (
          <form onSubmit={handleRequest} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 pl-10" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Request OTP"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">OTP</Label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required className="h-11 pl-10 tracking-widest text-center text-lg" placeholder="000000" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify Code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">New Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pl-10" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Reset Password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:underline">
            <ArrowLeft className="size-3.5" />
            Back to login
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
