import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/app/lib/prisma"
import { compare } from "bcryptjs"
import { User } from "@/generated/prisma"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
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
          throw new Error("Email and password required")
        }
        const user = await prisma.user.findUnique({
          where: { email: creds.email },
        })
        if (!user || !(await compare(creds.password, user.password!))) {
          throw new Error("Invalid email or password")
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, merge in returned user fields
      if (user) {
        token.id = user.id
        token.role = (user as User).role
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as string
      } as { id: string; role: string; } & typeof session.user
      return session
    },
  },
  pages: {
    signIn: "/auth/login",    // your custom sign-in page
    error: "/auth/error",     // error display page (optional)
  },
}
