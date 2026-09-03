import type { Adapter, AdapterUser } from "next-auth/adapters";

import { getPrisma } from "@/lib/krutai-server";

function mapUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified ? new Date() : null,
    image: user.image,
  };
}

/**
 * Minimal Auth.js adapter for JWT session strategy, mapped onto the existing
 * better-auth-style tables (user / account) so no schema migration is needed.
 *
 * Only the user/account methods are implemented because JWT sessions never
 * call createSession/getSessionAndUser/deleteSession.
 */
export function customPrismaAdapter(): Adapter {
  return {
    async createUser(data) {
      const prisma = await getPrisma();
      const user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: data.name ?? data.email?.split("@")[0] ?? "User",
          email: data.email!,
          emailVerified: data.emailVerified != null,
          image: data.image ?? null,
        },
      });
      return mapUser(user);
    },
    async getUserByEmail(email) {
      const prisma = await getPrisma();
      const user = await prisma.user.findFirst({ where: { email } });
      return user ? mapUser(user) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const prisma = await getPrisma();
      const account = await prisma.account.findFirst({
        where: { providerId: provider, accountId: providerAccountId },
        include: { user: true },
      });
      return account ? mapUser(account.user) : null;
    },
    async updateUser(user) {
      const prisma = await getPrisma();
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
        },
      });
      return mapUser(updated);
    },
    async linkAccount(account) {
      const prisma = await getPrisma();
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: account.userId,
          providerId: account.provider,
          accountId: account.providerAccountId,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          idToken: account.id_token ?? null,
          accessTokenExpiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
          refreshTokenExpiresAt: null,
          scope: account.scope ?? null,
          password: null,
        },
      });
    },
  };
}
