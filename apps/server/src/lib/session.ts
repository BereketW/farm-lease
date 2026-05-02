import type { Request } from "express";
import { auth } from "@farm-lease/auth";
import { prisma } from "@farm-lease/db";

export async function getRequestSession(req: Request) {
  const headerUserId =
    typeof req.headers["x-dev-user-id"] === "string"
      ? (req.headers["x-dev-user-id"] as string)
      : undefined;

  // 1. Always prioritize real sessions if cookie exists
  const cookie = req.headers.cookie;
  if (cookie) {
    const headers = new Headers();
    headers.set("cookie", cookie);

    const session = await auth.api.getSession({ headers });
    if (session?.user?.id) return session;
  }

  // 2. Only allow dev impersonation if explicitly enabled
  if (process.env.ALLOW_DEV_IMPERSONATION === "true" && headerUserId) {
    return getDevImpersonationSession(headerUserId);
  }

  return null;
}

async function getDevImpersonationSession(overrideUserId?: string) {
  if (process.env.NODE_ENV === "production") return null;

  const userId = overrideUserId || process.env.DEV_IMPERSONATE_USER_ID;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    session: {
      id: `dev-${user.id}`,
      userId: user.id,
    },
  };
}
