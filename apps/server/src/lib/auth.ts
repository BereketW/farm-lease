import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { getRequestSession } from "./session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role?: Role | string; email?: string | null };
    }
  }
}

export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await getRequestSession(req);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }
    req.user = {
      id: session.user.id,
      role: (session.user as { role?: Role | string }).role,
      email: (session.user as { email?: string | null }).email ?? null,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role as Role | undefined;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "FORBIDDEN", required: roles });
    }
    next();
  };
}
