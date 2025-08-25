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
        const rawEmail =
          typeof creds?.email === "string" ? creds.email.trim() : "";
        const email = rawEmail.toLowerCase(); // 🔸 normalize
        const password =
          typeof creds?.password === "string" ? creds.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        if (!user.approved) {
          // Your /login page should handle ?error=CallbackRouteError
          throw new Error("NotApproved");
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email, // already lowercased at signup
          name: user.name,
          role: user.role || "USER",
          status: (user as any).status ?? "APPROVED",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role ?? "USER";
        (token as any).status = (user as any).status ?? "APPROVED";
        // keep token email lowercased to avoid case drift
        if ((user as any).email)
          token.email = String((user as any).email).toLowerCase();
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = (token as any).role ?? "USER";
        (session.user as any).status = (token as any).status ?? "APPROVED";
        if (token?.email)
          session.user.email = String(token.email).toLowerCase();
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      try {
        if (user?.id) {
          await prisma.auditLog.create({
            data: { userId: String(user.id), action: "LOGIN" },
          });
        }
      } catch {
        // best-effort
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
