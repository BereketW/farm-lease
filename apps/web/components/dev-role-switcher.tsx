"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Check,
  ChevronsUpDown,
  KeyRound,
  ShieldCheck,
  Sprout,
  Wheat,
} from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@farm-lease/ui/components/dropdown-menu";
import { authClient } from "@farm-lease/auth/client";
import {
  DEV_USER_CHANGED_EVENT,
  DEV_USER_OPTIONS,
  getDevUserId,
  setDevUserId,
  type DevUserRole,
} from "@/lib/dev-user";
import { resetSocket } from "@/lib/socket";

const ROLE_ORDER: DevUserRole[] = [
  "INVESTOR",
  "REPRESENTATIVE",
  "FARMER",
  "ADMIN",
];

const ROLE_META: Record<
  DevUserRole,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    chip: string;
    iconWrap: string;
  }
> = {
  INVESTOR: {
    label: "Investor",
    icon: Briefcase,
    chip: "bg-emerald-100 text-emerald-800",
    iconWrap: "bg-emerald-600 text-white",
  },
  REPRESENTATIVE: {
    label: "Representative",
    icon: Sprout,
    chip: "bg-lime-100 text-lime-800",
    iconWrap: "bg-lime-600 text-white",
  },
  FARMER: {
    label: "Farmer",
    icon: Wheat,
    chip: "bg-amber-100 text-amber-900",
    iconWrap: "bg-amber-600 text-white",
  },
  ADMIN: {
    label: "Admin",
    icon: ShieldCheck,
    chip: "bg-zinc-200 text-zinc-800",
    iconWrap: "bg-zinc-700 text-white",
  },
};

export function DevRoleSwitcher() {
  const queryClient = useQueryClient();
  const [value, setValue] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { data: sessionData } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
    setValue(getDevUserId());
    const onChange = () => setValue(getDevUserId());
    window.addEventListener(DEV_USER_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(DEV_USER_CHANGED_EVENT, onChange);
  }, []);

  if (process.env.NODE_ENV === "production" || !mounted) return null;

  const sessionUser = sessionData?.user
    ? {
        id: sessionData.user.id,
        name: (sessionData.user as { name?: string | null }).name ?? sessionData.user.email ?? "Session user",
        email: sessionData.user.email,
        role: ((sessionData.user as { role?: DevUserRole }).role ?? "INVESTOR") as DevUserRole,
      }
    : null;

  const handleChange = (id: string) => {
    setDevUserId(id);
    resetSocket();
    void queryClient.invalidateQueries();
  };

  const handleSelectSession = () => {
    if (!sessionUser) return;
    setDevUserId(sessionUser.id);
    resetSocket();
    void queryClient.invalidateQueries();
  };

  // Session user is active when the dev override matches the session user's id.
  const sessionIsActive = !!sessionUser && value === sessionUser.id;

  const active = DEV_USER_OPTIONS.find((option) => option.id === value);
  const ActiveMeta = active
    ? ROLE_META[active.role]
    : sessionIsActive
      ? (ROLE_META[sessionUser!.role] ?? ROLE_META.INVESTOR)
      : null;
  const ActiveIcon = ActiveMeta?.icon ?? Sprout;

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    items: DEV_USER_OPTIONS.filter((option) => option.role === role),
  })).filter((group) => group.items.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group inline-flex h-10 items-center gap-2.5 rounded-full border border-emerald-200/80 bg-white pr-3 pl-1 text-left text-xs font-medium shadow-sm transition",
          "hover:border-emerald-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        )}
      >
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full",
            ActiveMeta?.iconWrap ?? "bg-emerald-100 text-emerald-700"
          )}
        >
          <ActiveIcon className="h-4 w-4" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {sessionIsActive ? "Signed in as" : "Acting as"}
          </span>
          <span className="truncate text-sm font-semibold text-emerald-950">
            {active
              ? active.label
              : sessionIsActive
                ? (sessionUser?.name ?? "Session user")
                : "Pick a user"}
          </span>
        </span>
        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground transition group-data-[state=open]:text-emerald-700" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 overflow-hidden rounded-xl border-emerald-100 p-0 shadow-lg"
      >
        <div className="border-b border-emerald-100 bg-emerald-50/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-700">
            Dev impersonation
          </p>
          <p className="text-xs text-emerald-900/70">
            Switch instantly — no restart required.
          </p>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-1">
          {/* Real session user */}
          {sessionUser ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center gap-2 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <KeyRound className="h-3 w-3" />
                  Session
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={handleSelectSession}
                  className={cn(
                    "mx-1 my-0.5 flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
                    sessionIsActive && "bg-emerald-50"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-md",
                      ROLE_META[sessionUser.role]?.iconWrap ?? ROLE_META.INVESTOR.iconWrap
                    )}
                  >
                    {(() => {
                      const Icon = ROLE_META[sessionUser.role]?.icon ?? ROLE_META.INVESTOR.icon;
                      return <Icon className="h-3.5 w-3.5" />;
                    })()}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{sessionUser.name}</span>
                    <span className="truncate text-[10px] text-muted-foreground">{sessionUser.email}</span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      ROLE_META[sessionUser.role]?.chip ?? ROLE_META.INVESTOR.chip
                    )}
                  >
                    {sessionUser.role.slice(0, 3)}
                  </span>
                  {sessionIsActive ? (
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                  ) : null}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          ) : null}

          {grouped.map((group, groupIndex) => {
            const Icon = ROLE_META[group.role].icon;
            return (
              <div key={group.role}>
                {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {ROLE_META[group.role].label}
                  </DropdownMenuLabel>
                  {group.items.map((option) => {
                    const meta = ROLE_META[option.role];
                    const selected = option.id === value;
                    return (
                      <DropdownMenuItem
                        key={option.id}
                        onSelect={() => handleChange(option.id)}
                        className={cn(
                          "mx-1 my-0.5 flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
                          selected && "bg-emerald-50"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-md",
                            meta.iconWrap
                          )}
                        >
                          <meta.icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 truncate font-medium">
                          {option.label}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                            meta.chip
                          )}
                        >
                          {option.role.slice(0, 3)}
                        </span>
                        {selected ? (
                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
