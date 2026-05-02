import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./index";

export const authClient = createAuthClient({
  // The auth handler is mounted at /api/auth/* in the Next.js web app.
  // Default to the web origin; override via NEXT_PUBLIC_AUTH_URL if deployed elsewhere.
  baseURL:
    process.env.NEXT_PUBLIC_AUTH_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"),
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
export const forgetPassword = (authClient as any).forgetPassword;
export const resetPassword = (authClient as any).resetPassword;
