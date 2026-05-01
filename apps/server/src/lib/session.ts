import type { Request } from "express";
import { auth } from "@farm-lease/auth";
import { prisma } from "@farm-lease/db";

export async function getRequestSession(req: Request) {
  const headerUserId =
    typeof req.headers["x-dev-user-id"] === "string"
      ? (req.headers["x-dev-user-id"] as string)
      : Array.isArray(req.headers["x-dev-user-id"])
        ? req.headers["x-dev-user-id"]![0]
        : undefined;

  // In dev, an explicit x-dev-user-id header always wins over the cookie so
  // the server identity stays in sync with the client-side dev user switcher.
  if (process.env.NODE_ENV !== "production" && headerUserId) {
    return getDevImpersonationSession(headerUserId);
  }

  const cookie = req.headers.cookie;
  if (!cookie) {
    return getDevImpersonationSession(headerUserId);
  }

  const headers = new Headers();
  headers.set("cookie", cookie);

  const session = await auth.api.getSession({ headers });
  if (session?.user?.id) return session;

  return getDevImpersonationSession(headerUserId);
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
