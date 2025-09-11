// FILE: src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Augment the global type so TypeScript knows about our cached instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Use a single PrismaClient across the app.
 * Next.js dev server hot-reloads files, so we cache the instance on globalThis.
 */
export const prisma: PrismaClient =
  globalThis.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Cache on global in development to avoid re-instantiating on HMR
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
