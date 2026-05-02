"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User as UserIcon, LogIn } from "lucide-react";
import { signOut } from "@/features/auth/datasource/auth-client";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@farm-lease/ui/components/dropdown-menu";
import { Avatar, AvatarFallback } from "@farm-lease/ui/components/avatar";

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function UserMenu() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent"
      >
        <LogIn className="mr-1.5 size-3.5" />
        Sign in
      </Link>
    );
  }

  async function handleSignOut() {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // Hard navigation to clear all client state
            window.location.href = "/login";
          },
        },
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      // Force redirect even if signOut fails
      window.location.href = "/login";
    }
  }

  const u = user as { name?: string | null; email?: string | null; role?: string | null };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent"
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">
              {initials(u.name, u.email).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{u.name ?? "Unnamed"}</span>
            <span className="text-xs font-normal text-muted-foreground">{u.email}</span>
            {u.role && (
              <span className="mt-1 inline-flex w-fit rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {u.role}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserIcon className="mr-2 size-4" />
            Profile & settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
