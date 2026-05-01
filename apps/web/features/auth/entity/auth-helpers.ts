export type Role = "INVESTOR" | "FARMER" | "REPRESENTATIVE" | "ADMIN";

type UserWithRole = { role?: string | null } | null | undefined;

export function hasRole(user: UserWithRole, role: Role): boolean {
  return user?.role === role;
}

export function hasAnyRole(user: UserWithRole, roles: Role[]): boolean {
  const r = user?.role;
  return r != null && roles.includes(r as Role);
}

export const ROLE_HOME: Record<Role, string> = {
  INVESTOR: "/proposals",
  FARMER: "/proposals",
  REPRESENTATIVE: "/proposals",
  ADMIN: "/proposals",
};
