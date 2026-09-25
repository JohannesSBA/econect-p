import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import prisma from "@/lib/prisma";
import { User } from "@/generated/prisma";

const authSecret = process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  throw new Error("NEXTAUTH_SECRET is required for authentication");
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Email / Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) {
          throw new Error("Email and password required");
        }
        const user = await prisma.user.findUnique({
          where: { email: creds.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
          },
        });
        if (!user?.password) {
          throw new Error("Invalid email or password");
        }
        const valid = await compare(creds.password, user.password);
        if (!valid) throw new Error("Invalid email or password");
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, merge in returned user fields
      if (user) {
        token.id = user.id;
        token.role = (user as User).role;
      }
      return token;
    },
    async session({ session, token }) {
      // Check if session.user exists before accessing it
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        } as { id: string; role: string } & typeof session.user;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login", // your custom sign-in page
    error: "/auth/error", // error display page (optional)
  },
};
