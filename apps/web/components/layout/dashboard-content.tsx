import { cn } from "@farm-lease/ui/lib/utils";

export function DashboardHeaderInner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      {children}
    </div>
  );
}

export function DashboardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("relative w-full px-6 py-10 sm:px-10 lg:px-14", className)}>
      {children}
    </main>
  );
}
