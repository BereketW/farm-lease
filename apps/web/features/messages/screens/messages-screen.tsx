"use client";

export function MessagesScreen() {
    return (
        <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
            <header className="border-b border-emerald-950/15 bg-white px-6 py-8 dark:border-emerald-400/15 dark:bg-stone-950 sm:px-10 lg:px-14">
                <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                            My{" "}
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                                Messages
                            </span>
                        </h1>
                        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                            View and manage all your conversations and notifications in one place.
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1400px] p-6">
                Placeholder content
            </main>
        </div>
    );
}
