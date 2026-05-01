import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { auth } from "@farm-lease/auth";
import { prisma } from "@farm-lease/db";

export type AuthedSocket = Socket & {
  data: {
    userId: string;
    userRole?: string;
  };
};

let ioInstance: SocketIOServer | null = null;

export function initIO(httpServer: HTTPServer): SocketIOServer {
  if (ioInstance) return ioInstance;

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.WEB_ORIGIN ?? "http://localhost:3001",
      credentials: true,
    },
  });

  // Authentication middleware: resolves Better-Auth session from the
  // forwarded cookie header so a socket can join only its user's room.
  io.use(async (socket, next) => {
    try {
      const devUserIdFromHandshake =
        typeof (socket.handshake.auth as { userId?: unknown } | undefined)?.userId ===
        "string"
          ? ((socket.handshake.auth as { userId?: string }).userId ?? "")
          : "";
      const devFallbackUserId =
        process.env.NODE_ENV !== "production"
          ? devUserIdFromHandshake || process.env.DEV_IMPERSONATE_USER_ID || ""
          : "";

      const cookie =
        socket.handshake.headers.cookie ??
        (socket.handshake.auth as { cookie?: string } | undefined)?.cookie;

      if (!cookie) {
        if (!devFallbackUserId) return next(new Error("UNAUTHENTICATED"));

        const user = await prisma.user.findUnique({ where: { id: devFallbackUserId } });
        if (!user) return next(new Error("UNAUTHENTICATED"));

        (socket as AuthedSocket).data.userId = user.id;
        (socket as AuthedSocket).data.userRole = user.role;
        return next();
      }

      const headers = new Headers();
      headers.set("cookie", cookie);

      const session = await auth.api.getSession({ headers });
      if (!session?.user?.id) {
        if (!devFallbackUserId) return next(new Error("UNAUTHENTICATED"));

        const user = await prisma.user.findUnique({ where: { id: devFallbackUserId } });
        if (!user) return next(new Error("UNAUTHENTICATED"));

        (socket as AuthedSocket).data.userId = user.id;
        (socket as AuthedSocket).data.userRole = user.role;
        return next();
      }

      (socket as AuthedSocket).data.userId = session.user.id;
      (socket as AuthedSocket).data.userRole =
        (session.user as { role?: string }).role;
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  io.on("connection", (socket) => {
    const s = socket as AuthedSocket;
    // Personal room for direct notifications
    s.join(`user:${s.data.userId}`);

    s.on("proposal:join", (proposalId: string) => {
      if (typeof proposalId === "string" && proposalId.length > 0) {
        s.join(`proposal:${proposalId}`);
      }
    });

    s.on("proposal:leave", (proposalId: string) => {
      if (typeof proposalId === "string") {
        s.leave(`proposal:${proposalId}`);
      }
    });

    // Typing indicator. We trust the room membership (only joined sockets
    // see the broadcast) and re-tag the event with the server-known userId
    // so a malicious client can't impersonate someone else.
    s.on(
      "proposal:typing",
      (payload: { proposalId?: string; isTyping?: boolean; name?: string }) => {
        const { proposalId, isTyping, name } = payload ?? {};
        if (typeof proposalId !== "string" || proposalId.length === 0) return;
        s.to(`proposal:${proposalId}`).emit("proposal:typing", {
          proposalId,
          userId: s.data.userId,
          name: typeof name === "string" ? name : null,
          isTyping: !!isTyping,
        });
      }
    );

    s.on("agreement:join", (agreementId: string) => {
      if (typeof agreementId === "string" && agreementId.length > 0) {
        s.join(`agreement:${agreementId}`);
      }
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialised. Call initIO(httpServer) first.");
  }
  return ioInstance;
}

// Convenience emitters used by domain services
export const realtime = {
  toUser(userId: string, event: string, payload: unknown) {
    getIO().to(`user:${userId}`).emit(event, payload);
  },
  toProposal(proposalId: string, event: string, payload: unknown) {
    getIO().to(`proposal:${proposalId}`).emit(event, payload);
  },
  toAgreement(agreementId: string, event: string, payload: unknown) {
    getIO().to(`agreement:${agreementId}`).emit(event, payload);
  },
};
