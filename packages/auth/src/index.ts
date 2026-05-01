import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNextJsHandler } from "better-auth/next-js";
import { prisma } from "@farm-lease/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "INVESTOR",
        input: true,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "PENDING",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  trustedOrigins: [process.env.WEB_ORIGIN ?? "http://localhost:3001"],
});

export const { GET, POST } = toNextJsHandler(auth);

export type Auth = typeof auth;
