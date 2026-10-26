import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export const devLoginEnabled = process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_LOGIN === "true";

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      prompt: "select_account" as const,
    },
  }),
  ...(process.env.MICROSOFT_CLIENT_ID && {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
      tenantId: "common",
      prompt: "select_account" as const,
    },
  }),
};

export const enabledProviders = Object.keys(socialProviders) as ("google" | "microsoft")[];

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, camelCase: true }),
  socialProviders,
  emailAndPassword: { enabled: devLoginEnabled },
  account: {
    // Same person signing in with Google one week and Microsoft the next keeps one profile.
    // Only Google is trusted to vouch for email ownership; Microsoft "common" email claims aren't verified.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "pending" },
      isAdmin: { type: "boolean", input: false, defaultValue: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // players shouldn't have to sign in every week
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          // People in ADMIN_EMAILS join as approved players who also run the app.
          data: adminEmails.has(user.email.toLowerCase())
            ? { ...user, role: "player", isAdmin: true }
            : { ...user, role: "pending", isAdmin: false },
        }),
      },
    },
  },
  plugins: [nextCookies()],
});
