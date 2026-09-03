import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { customPrismaAdapter } from "@/server/auth/prisma-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: customPrismaAdapter(),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Existing users signed up with email + OTP, so their email already
      // exists in the user table. Without this, Google sign-in for those
      // users fails with OAuthAccountNotLinked.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    error: "/sign-in",
  },
});
