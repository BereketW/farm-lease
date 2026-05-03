"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";

import { AdminDashboardContent } from "../components/admin-dashboard-content";
import { FarmerDashboardContent } from "../components/farmer-dashboard-content";
import { InvestorDashboardContent } from "../components/investor-dashboard-content";
import { RepresentativeDashboardContent } from "../components/representative-dashboard-content";

export function DashboardScreen() {
    const { isAdmin, isRepresentative, isFarmer } = useAuth();

    const roleType = isAdmin
        ? "admin"
        : isRepresentative
          ? "representative"
          : isFarmer
            ? "farmer"
            : "investor";

    const role = roleType === "admin"
        ? { kicker: "Global oversight", title: "Admin dashboard" }
        : roleType === "representative"
          ? { kicker: "Cluster desk", title: "Representative dashboard" }
          : roleType === "farmer"
            ? { kicker: "Farmer desk", title: "Farmer dashboard" }
            : { kicker: "Investor desk", title: "Investor dashboard" };

    const lede = roleType === "admin"
        ? "Platform-wide visibility across proposals, agreements, and cluster activity."
        : roleType === "representative"
          ? "Review incoming items and manage cluster-side operations from one place."
          : roleType === "farmer"
            ? "Track your proposals, agreements, and farming activity in a single view."
            : "Manage your investment portfolio and track your investments in one place.";

        const roleContent =
                roleType === "admin"
                        ? <AdminDashboardContent />
                        : roleType === "representative"
                            ? <RepresentativeDashboardContent />
                            : roleType === "farmer"
                                ? <FarmerDashboardContent />
                                : <InvestorDashboardContent />;

    const titleParts = role.title.split(" ");
    const firstWord = titleParts[0];
    const restOfTitle = titleParts.slice(1).join(" ");

    return (
        <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
            <header className="border-b border-emerald-950/15 bg-white px-6 py-8 dark:border-emerald-400/15 dark:bg-stone-950 sm:px-10 lg:px-14">
                <div className="mx-auto flex w-full max-w-350 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                            {firstWord}{" "}
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                                {restOfTitle}
                            </span>
                        </h1>
                        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                            {lede}
                        </p>
                    </div>
                </div>
            </header>

            <main className="relative mx-auto w-full max-w-350 px-6 py-10 sm:px-10 lg:px-14">
                <section className="rounded-sm border border-emerald-950/10 bg-white/70 p-6 dark:border-emerald-400/10 dark:bg-stone-900/60">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
                        Signed in as {role.title}
                    </p>

                    {roleContent}
                </section>
            </main>
        </div>
    );
}
