import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, emailOTPClient } from "better-auth/client/plugins";
import type { auth } from "./index";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_AUTH_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"),
  plugins: [
    inferAdditionalFields<typeof auth>(),
    emailOTPClient()
  ],
});

export const { signIn, signOut, signUp, useSession, emailOtp } = authClient;
