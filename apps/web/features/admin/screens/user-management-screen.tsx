"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  ShieldCheck,
  UserCog,
  UserCheck,
  UserX,
  Crown,
  Mail,
  Clock3,
  CalendarDays,
  LayoutGrid,
  Table as TableIcon,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import {
  getUserAuditLogs,
  listUsers,
  promoteToAdmin,
  updateUserRole,
  updateUserStatus,
  type UserSummary,
} from "../datasource/users";
import {
  EditorialPagination,
  EditorialToggle,
  HorizonRule,
  Masthead,
  Metric,
  NameAvatar,
  Ornament,
  PaperGrain,
  SectionHeader,
  StatusPill,
  usePagination,
  type StatusTone,
} from "@/components/editorial";
import {
  DashboardContent,
  DashboardHeaderInner,
} from "@/components/layout/dashboard-content";

const ROLE_TONE: Record<UserSummary["role"], StatusTone> = {
  ADMIN: "violet",
  REPRESENTATIVE: "sky",
  INVESTOR: "emerald",
  FARMER: "lime",
};

const STATUS_TONE: Record<UserSummary["status"], StatusTone> = {
  ACTIVE: "emerald",
  PENDING: "amber",
  SUSPENDED: "rose",
};

function formatDate(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(d: string | null) {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

type ViewMode = "cards" | "table";

export function UserManagementScreen() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | UserSummary["role"]>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  useEffect(() => {
    if (!data?.users.length) return;
    if (selectedUserId && data.users.some((u) => u.id === selectedUserId)) return;
    setSelectedUserId(data.users[0].id);
  }, [data, selectedUserId]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserSummary["status"] }) =>
      updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserSummary["role"] }) =>
      updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const promoteMutation = useMutation({
    mutationFn: (id: string) => promoteToAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User promoted to admin");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const auditQuery = useQuery({
    queryKey: ["user-audit", selectedUserId],
    queryFn: () => getUserAuditLogs(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const users = data?.users ?? [];

  const counts = useMemo(() => {
    const c = { total: users.length, active: 0, pending: 0, suspended: 0, admins: 0 };
    for (const u of users) {
      if (u.status === "ACTIVE") c.active += 1;
      else if (u.status === "PENDING") c.pending += 1;
      else if (u.status === "SUSPENDED") c.suspended += 1;
      if (u.role === "ADMIN") c.admins += 1;
    }
    return c;
  }, [users]);

  const visible = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== "all" && u.role !== filterRole) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (u.name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, filterRole]);

  const {
    items: pagedUsers,
    page: userPage,
    pageCount: userPageCount,
    setPage: setUserPage,
  } = usePagination(visible, 8);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  return (
    <div className="relative flex flex-1 flex-col bg-stone-50/60 dark:bg-stone-950/60">
      <PaperGrain />

      <header className="relative border-b border-emerald-950/15 bg-linear-to-b from-stone-50/90 to-transparent px-6 pb-10 pt-10 dark:border-emerald-400/15 dark:from-stone-950/80 sm:px-10 lg:px-14">
        <DashboardHeaderInner>
          <Masthead
            publication="FarmLease · Registry"
            kicker="Steward console"
            title="The People's Roster"
            italicWord="Roster"
            lede="Every account, every privilege, every audited footstep — managed under the watchful eye of the platform stewards."
          />
        </DashboardHeaderInner>
      </header>

      <DashboardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-6 animate-spin text-emerald-700" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Almanac */}
            <section>
              <SectionHeader title="The Almanac" eyebrow="Population summary" />
              <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-emerald-950/10 bg-emerald-950/10 dark:border-emerald-400/10 dark:bg-emerald-400/10 sm:grid-cols-4">
                <Metric
                  label="All entries"
                  value={counts.total}
                  hint="On the registry"
                  index="i"
                  className="rounded-none border-0"
                />
                <Metric
                  label="Active"
                  value={counts.active}
                  tone="emerald"
                  hint="Signed in & operational"
                  index="ii"
                  className="rounded-none border-0"
                />
                <Metric
                  label="Pending"
                  value={counts.pending}
                  tone="amber"
                  hint="Awaiting activation"
                  index="iii"
                  className="rounded-none border-0"
                />
                <Metric
                  label="Suspended"
                  value={counts.suspended}
                  tone="rose"
                  hint="Privileges revoked"
                  index="iv"
                  className="rounded-none border-0"
                />
              </div>
            </section>

            {/* Toolbar */}
            <section className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-sm border border-emerald-950/15 bg-white/80 py-2 pl-9 pr-3 font-serif text-sm italic text-stone-800 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700/30 dark:border-emerald-400/15 dark:bg-stone-900/60 dark:text-stone-100 dark:placeholder:text-stone-500"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                />
              </div>
              <EditorialToggle<ViewMode>
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    value: "cards",
                    label: "Cards",
                    icon: <LayoutGrid className="h-3 w-3" />,
                  },
                  {
                    value: "table",
                    label: "Table",
                    icon: <TableIcon className="h-3 w-3" />,
                  },
                ]}
              />
              <nav
                className="flex flex-wrap items-end gap-x-5 gap-y-1"
                aria-label="Filter by role"
              >
                {(["all", "ADMIN", "REPRESENTATIVE", "INVESTOR", "FARMER"] as const).map(
                  (r) => {
                    const active = filterRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFilterRole(r)}
                        className={cn(
                          "group relative -mb-px flex items-baseline gap-2 border-b-2 pb-2 pt-1 transition-colors",
                          active
                            ? "border-emerald-800 dark:border-emerald-300"
                            : "border-transparent hover:border-emerald-800/30"
                        )}
                      >
                        <span
                          className={cn(
                            "font-serif text-[14px] italic transition-colors",
                            active
                              ? "text-emerald-900 dark:text-emerald-100"
                              : "text-stone-500 group-hover:text-emerald-900 dark:text-stone-400"
                          )}
                          style={{ fontFamily: "var(--font-fraunces)" }}
                        >
                          {r === "all"
                            ? "All"
                            : r.charAt(0) + r.slice(1).toLowerCase()}
                        </span>
                      </button>
                    );
                  }
                )}
              </nav>
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
              {/* User Cards */}
              <section className="space-y-4">
                <SectionHeader
                  title="The Registry"
                  eyebrow={`${visible.length} of ${users.length}`}
                />

                {visible.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-emerald-950/15 bg-white/60 px-6 py-12 text-center dark:border-emerald-400/15 dark:bg-stone-900/40">
                    <p
                      className="font-serif text-sm italic text-stone-500"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      No accounts match the current filter.
                    </p>
                  </div>
                ) : viewMode === "table" ? (
                  <UsersTable
                    users={pagedUsers}
                    selectedUserId={selectedUserId}
                    indexOffset={(userPage - 1) * 8}
                    onSelect={setSelectedUserId}
                    onActivate={(id) =>
                      statusMutation.mutate({ id, status: "ACTIVE" })
                    }
                    onSuspend={(id) =>
                      statusMutation.mutate({ id, status: "SUSPENDED" })
                    }
                    onSetRole={(id, role) => roleMutation.mutate({ id, role })}
                    onPromote={(id) => promoteMutation.mutate(id)}
                    mutating={
                      statusMutation.isPending ||
                      roleMutation.isPending ||
                      promoteMutation.isPending
                    }
                    page={userPage}
                    pageCount={userPageCount}
                    setPage={setUserPage}
                  />
                ) : (
                  <>
                    {pagedUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        selected={user.id === selectedUserId}
                        onSelect={() => setSelectedUserId(user.id)}
                        onActivate={() =>
                          statusMutation.mutate({ id: user.id, status: "ACTIVE" })
                        }
                        onSuspend={() =>
                          statusMutation.mutate({ id: user.id, status: "SUSPENDED" })
                        }
                        onSetRole={(role) =>
                          roleMutation.mutate({ id: user.id, role })
                        }
                        onPromote={() => promoteMutation.mutate(user.id)}
                        mutating={
                          statusMutation.isPending ||
                          roleMutation.isPending ||
                          promoteMutation.isPending
                        }
                      />
                    ))}
                    {userPageCount > 1 ? (
                      <div className="overflow-hidden rounded-sm border border-emerald-950/10 bg-white/60 dark:border-emerald-400/10 dark:bg-stone-900/40">
                        <EditorialPagination
                          page={userPage}
                          pageCount={userPageCount}
                          onPageChange={setUserPage}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </section>

              {/* Audit Sidebar */}
              <aside className="lg:sticky lg:top-5 lg:self-start">
                <AuditPanel
                  user={selectedUser}
                  loading={auditQuery.isLoading}
                  error={auditQuery.error as Error | null}
                  logs={auditQuery.data?.logs ?? []}
                />
              </aside>
            </div>
          </div>
        )}
      </DashboardContent>
    </div>
  );
}

// ============================================================
// User Card
// ============================================================

function UserCard({
  user,
  selected,
  onSelect,
  onActivate,
  onSuspend,
  onSetRole,
  onPromote,
  mutating,
}: {
  user: UserSummary;
  selected: boolean;
  onSelect: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onSetRole: (role: UserSummary["role"]) => void;
  onPromote: () => void;
  mutating: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-sm border bg-white/80 px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors dark:bg-stone-900/60",
        selected
          ? "border-emerald-700/60 ring-1 ring-emerald-700/20 dark:border-emerald-400/60"
          : "border-emerald-950/10 hover:border-emerald-700/30 dark:border-emerald-400/10"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <NameAvatar
            id={user.id}
            name={user.name}
            email={user.email}
            size="md"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="truncate font-serif text-base text-stone-900 dark:text-stone-50"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {user.name ?? "Unnamed steward"}
              </h3>
              {user.role === "ADMIN" ? (
                <Crown
                  className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400"
                  aria-label="Admin"
                />
              ) : null}
            </div>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <Mail className="h-3 w-3" />
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill label={user.role} tone={ROLE_TONE[user.role]} size="sm" />
          <StatusPill
            label={user.status}
            tone={STATUS_TONE[user.status]}
            size="sm"
            pulse={user.status === "PENDING"}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          Joined {formatDate(user.createdAt)}
        </span>
        <Ornament />
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3 w-3" />
          Last seen {formatRelative(user.lastLoginAt)}
        </span>
      </div>

      <HorizonRule className="my-3" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {user.status !== "ACTIVE" ? (
            <ActionChip
              icon={<UserCheck className="h-3 w-3" />}
              tone="emerald"
              onClick={onActivate}
              disabled={mutating}
            >
              Activate
            </ActionChip>
          ) : null}
          {user.status !== "SUSPENDED" ? (
            <ActionChip
              icon={<UserX className="h-3 w-3" />}
              tone="rose"
              onClick={onSuspend}
              disabled={mutating}
            >
              Suspend
            </ActionChip>
          ) : null}
          {user.role !== "REPRESENTATIVE" ? (
            <ActionChip
              icon={<UserCog className="h-3 w-3" />}
              tone="sky"
              onClick={() => onSetRole("REPRESENTATIVE")}
              disabled={mutating}
            >
              Set Rep
            </ActionChip>
          ) : null}
          {user.role !== "INVESTOR" ? (
            <ActionChip
              icon={<UserCog className="h-3 w-3" />}
              tone="emerald"
              onClick={() => onSetRole("INVESTOR")}
              disabled={mutating}
            >
              Set Investor
            </ActionChip>
          ) : null}
          {user.role !== "ADMIN" ? (
            <ActionChip
              icon={<Crown className="h-3 w-3" />}
              tone="violet"
              onClick={onPromote}
              disabled={mutating}
            >
              Promote Admin
            </ActionChip>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors",
            selected
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-emerald-950/15 bg-white text-emerald-900 hover:border-emerald-700/50 hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-stone-900 dark:text-emerald-200 dark:hover:bg-stone-800"
          )}
        >
          <ShieldCheck className="h-3 w-3" />
          {selected ? "Viewing" : "View Audit"}
        </button>
      </div>
    </article>
  );
}

function ActionChip({
  icon,
  tone,
  onClick,
  disabled,
  children,
}: {
  icon: React.ReactNode;
  tone: "emerald" | "rose" | "sky" | "violet";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const TONE_CLASS: Record<string, string> = {
    emerald:
      "border-emerald-700/30 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-400/30 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
    rose: "border-rose-700/30 text-rose-800 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-950/40",
    sky: "border-sky-700/30 text-sky-800 hover:bg-sky-50 dark:border-sky-400/30 dark:text-sky-300 dark:hover:bg-sky-950/40",
    violet:
      "border-violet-700/30 text-violet-800 hover:bg-violet-50 dark:border-violet-400/30 dark:text-violet-300 dark:hover:bg-violet-950/40",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border bg-white/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors disabled:opacity-50 dark:bg-stone-900/60",
        TONE_CLASS[tone]
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ============================================================
// Users Table (dense view)
// ============================================================

function UsersTable({
  users,
  selectedUserId,
  indexOffset,
  onSelect,
  onActivate,
  onSuspend,
  onSetRole,
  onPromote,
  mutating,
  page,
  pageCount,
  setPage,
}: {
  users: UserSummary[];
  selectedUserId: string | null;
  indexOffset: number;
  onSelect: (id: string) => void;
  onActivate: (id: string) => void;
  onSuspend: (id: string) => void;
  onSetRole: (id: string, role: UserSummary["role"]) => void;
  onPromote: (id: string) => void;
  mutating: boolean;
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-emerald-950/10 bg-white/60 backdrop-blur-[1px] dark:border-emerald-400/10 dark:bg-stone-950/40">
      {/* Column headers */}
      <div className="hidden grid-cols-[40px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_140px] items-center gap-4 border-b border-emerald-950/10 bg-stone-50/60 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:border-emerald-400/10 dark:bg-stone-900/30 dark:text-stone-500 sm:grid">
        <span className="text-center">Nº</span>
        <span>Steward</span>
        <span>Role</span>
        <span>Status</span>
        <span>Last seen</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="overflow-x-auto">
        <ul className="divide-y divide-emerald-950/10 dark:divide-emerald-400/10">
          {users.map((user, i) => {
            const selected = user.id === selectedUserId;
            return (
              <li
                key={user.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-900/30",
                  "sm:grid-cols-[40px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_140px] sm:gap-4",
                  selected &&
                    "bg-emerald-50/50 hover:bg-emerald-50/60 dark:bg-emerald-950/20"
                )}
              >
                {/* Index */}
                <span
                  className="hidden select-none text-center font-serif text-xl italic tabular-nums text-emerald-900/40 dark:text-emerald-300/30 sm:inline"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                  aria-hidden
                >
                  {String(indexOffset + i + 1).padStart(2, "0")}
                </span>

                {/* Steward */}
                <button
                  type="button"
                  onClick={() => onSelect(user.id)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <NameAvatar
                    id={user.id}
                    name={user.name}
                    email={user.email}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="truncate font-serif text-[14px] text-stone-900 dark:text-stone-50"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                      >
                        {user.name ?? "Unnamed"}
                      </p>
                      {user.role === "ADMIN" ? (
                        <Crown
                          className="h-3 w-3 shrink-0 text-violet-600 dark:text-violet-400"
                          aria-label="Admin"
                        />
                      ) : null}
                    </div>
                    <p className="inline-flex items-center gap-1 truncate text-[11px] text-stone-500 dark:text-stone-400">
                      <Mail className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </p>
                  </div>
                </button>

                {/* Role */}
                <span className="hidden sm:inline-flex">
                  <StatusPill
                    label={user.role}
                    tone={ROLE_TONE[user.role]}
                    size="sm"
                  />
                </span>

                {/* Status */}
                <span className="hidden sm:inline-flex">
                  <StatusPill
                    label={user.status}
                    tone={STATUS_TONE[user.status]}
                    size="sm"
                    pulse={user.status === "PENDING"}
                  />
                </span>

                {/* Last seen */}
                <span
                  className="hidden font-mono text-[10px] tabular-nums text-stone-500 dark:text-stone-500 sm:inline"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {formatRelative(user.lastLoginAt)}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <RowActionMenu
                    user={user}
                    disabled={mutating}
                    onActivate={() => onActivate(user.id)}
                    onSuspend={() => onSuspend(user.id)}
                    onSetRole={(role) => onSetRole(user.id, role)}
                    onPromote={() => onPromote(user.id)}
                  />
                  <button
                    type="button"
                    onClick={() => onSelect(user.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] transition-colors",
                      selected
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-emerald-950/15 bg-white text-emerald-900 hover:border-emerald-700/50 hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-stone-900 dark:text-emerald-200"
                    )}
                  >
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {selected ? "Viewing" : "Audit"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {pageCount > 1 ? (
        <EditorialPagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

function RowActionMenu({
  user,
  disabled,
  onActivate,
  onSuspend,
  onSetRole,
  onPromote,
}: {
  user: UserSummary;
  disabled: boolean;
  onActivate: () => void;
  onSuspend: () => void;
  onSetRole: (role: UserSummary["role"]) => void;
  onPromote: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
        className="grid h-7 w-7 place-items-center rounded-sm border border-emerald-950/15 bg-white text-stone-600 transition-colors hover:border-emerald-700/40 hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-40 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-stone-400"
        aria-label={`Actions for ${user.name ?? user.email}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-sm border border-emerald-950/15 bg-white shadow-lg dark:border-emerald-400/15 dark:bg-stone-900"
        >
          {user.status !== "ACTIVE" ? (
            <MenuItem
              icon={<UserCheck className="h-3 w-3 text-emerald-700" />}
              onClick={onActivate}
            >
              Activate
            </MenuItem>
          ) : null}
          {user.status !== "SUSPENDED" ? (
            <MenuItem
              icon={<UserX className="h-3 w-3 text-rose-700" />}
              onClick={onSuspend}
            >
              Suspend
            </MenuItem>
          ) : null}
          <div className="my-0.5 h-px bg-emerald-950/10 dark:bg-emerald-400/10" />
          {user.role !== "REPRESENTATIVE" ? (
            <MenuItem
              icon={<UserCog className="h-3 w-3 text-sky-700" />}
              onClick={() => onSetRole("REPRESENTATIVE")}
            >
              Set Representative
            </MenuItem>
          ) : null}
          {user.role !== "INVESTOR" ? (
            <MenuItem
              icon={<UserCog className="h-3 w-3 text-emerald-700" />}
              onClick={() => onSetRole("INVESTOR")}
            >
              Set Investor
            </MenuItem>
          ) : null}
          {user.role !== "ADMIN" ? (
            <MenuItem
              icon={<Crown className="h-3 w-3 text-violet-700" />}
              onClick={onPromote}
            >
              Promote to Admin
            </MenuItem>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900 dark:text-stone-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
    >
      {icon}
      {children}
    </button>
  );
}

// ============================================================
// Audit Panel
// ============================================================

type UserAuditLogRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: unknown;
  createdAt: string;
  actor: { id: string; name: string | null; role: string; email: string };
};

function AuditPanel({
  user,
  loading,
  error,
  logs,
}: {
  user: UserSummary | null;
  loading: boolean;
  error: Error | null;
  logs: UserAuditLogRow[];
}) {
  const {
    items: pagedLogs,
    page,
    pageCount,
    setPage,
  } = usePagination(logs, 10);
  return (
    <div className="overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.02)] dark:border-emerald-400/15 dark:bg-stone-900/60">
      <header className="border-b border-emerald-950/10 bg-emerald-50/40 px-5 py-4 dark:border-emerald-400/10 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
            Guardian Ledger
          </p>
        </div>
        <h3
          className="mt-1 font-serif text-lg italic text-emerald-950 dark:text-emerald-50"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {user ? user.name ?? user.email : "Select a steward"}
        </h3>
        {user ? (
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            All actions performed by or upon this account.
          </p>
        ) : null}
      </header>

      <div className="max-h-[640px] overflow-y-auto px-5 py-4">
        {!user ? (
          <p
            className="text-center font-serif text-sm italic text-stone-500"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Choose an account from the registry to inspect their footprint.
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-4 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-700 dark:text-rose-400">{error.message}</p>
        ) : logs.length === 0 ? (
          <p
            className="py-6 text-center font-serif text-sm italic text-stone-500"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            No audit entries on file.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-emerald-950/10 pl-5 dark:border-emerald-400/10">
            {pagedLogs.map((log) => (
              <li key={log.id} className="relative">
                <span
                  className="absolute left-[-23px] top-1.5 h-2 w-2 rotate-45 bg-emerald-700 dark:bg-emerald-400"
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">
                    {log.action}
                    <span className="ml-2 text-stone-400">·</span>
                    <span className="ml-2 text-stone-500 dark:text-stone-400">
                      {log.targetType}
                    </span>
                  </p>
                  <time className="font-mono text-[10px] tabular-nums text-stone-400">
                    {new Date(log.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400">
                  by{" "}
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {log.actor.name ?? log.actor.email}
                  </span>{" "}
                  <span className="text-stone-400">({log.actor.role})</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
      {pageCount > 1 ? (
        <EditorialPagination page={page} pageCount={pageCount} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
