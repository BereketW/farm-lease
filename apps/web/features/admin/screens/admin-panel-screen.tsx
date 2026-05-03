"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { Button } from "@farm-lease/ui/components/button";
import { FileText, UserPlus } from "lucide-react";

export function AdminPanelScreen() {
    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
                <header className="border-b border-emerald-950/15 bg-white px-6 py-8 dark:border-emerald-400/15 dark:bg-stone-950 sm:px-10 lg:px-14">
                    <div className="mx-auto flex w-full max-w-350 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                                Admin{" "}
                                <span className="font-semibold  text-emerald-800 dark:text-emerald-300">
                                    Control Center
                                </span>
                            </h1>
                            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                                Manage users, verify entities, and monitor
                                system performance.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Export Report
                            </Button>
                            <Button className="gap-2  bg-emerald-800 dark:bg-emerald-300 text-white dark:text-black">
                                <UserPlus className="h-4 w-4" />
                                Invite User
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="relative mx-auto w-full max-w-350 px-6 py-10 sm:px-10 lg:px-14">
                    <section className="rounded-sm border border-emerald-950/10 bg-white/70 p-6 dark:border-emerald-400/10 dark:bg-stone-900/60">
                        <p className="text-sm text-stone-700 dark:text-stone-300">
                            This area is restricted to administrators.
                        </p>
                    </section>
                </main>
            </div>
        </RoleGuard>
    );
}
