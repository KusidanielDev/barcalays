// FILE: src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  trustHost: true,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email =
          typeof creds?.email === "string" ? creds.email.trim() : "";
        const password =
          typeof creds?.password === "string" ? creds.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // Block sign-in until an admin approves the account
        if (!user.approved) {
          // Your /login page should detect ?error=CallbackRouteError and show the "pending approval" UI.
          throw new Error("NotApproved");
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Minimal user object persisted into JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "USER",
          status: (user as any).status ?? "APPROVED",
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role ?? "USER";
        (token as any).status = (user as any).status ?? "APPROVED";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = (token as any).role ?? "USER";
        (session.user as any).status = (token as any).status ?? "APPROVED";
      }
      return session;
    },
  },

  // Optional: record successful sign-ins in AuditLog
  events: {
    async signIn({ user }) {
      try {
        if (user?.id) {
          await prisma.auditLog.create({
            data: { userId: String(user.id), action: "LOGIN" },
          });
        }
      } catch {
        // best-effort; ignore failures
      }
    },
  },

  pages: { signIn: "/login" },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
