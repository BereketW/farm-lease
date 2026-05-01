"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getDevUserId } from "./dev-user";

let socketInstance: Socket | null = null;
let _version = 0;
const _listeners = new Set<() => void>();

export function getSocket(): Socket {
  if (socketInstance) return socketInstance;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const devUserId = process.env.NODE_ENV !== "production" ? getDevUserId() : null;

  socketInstance = io(apiUrl, {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: devUserId ? { userId: devUserId } : undefined,
  });

  return socketInstance;
}

export function resetSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  _version++;
  _listeners.forEach((fn) => fn());
}

export function useSocketVersion(): number {
  const [version, setVersion] = useState(() => _version);
  useEffect(() => {
    const fn = () => setVersion((v) => v + 1);
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  }, []);
  return version;
}
