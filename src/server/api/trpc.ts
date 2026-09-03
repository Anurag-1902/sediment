import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { decode } from "next-auth/jwt";
import superjson from "superjson";

import { getAuthClient, getPrisma } from "@/lib/krutai-server";
import { getCookie, SESSION_COOKIE } from "./cookies";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
const NEXTAUTH_SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

async function getNextAuthSession(cookieHeader: string | null) {
  for (const cookieName of NEXTAUTH_SESSION_COOKIES) {
    const token = getCookie(cookieHeader, cookieName);

    if (!token || !NEXTAUTH_SECRET) {
      continue;
    }

    try {
      const decoded = await decode({
        token,
        secret: NEXTAUTH_SECRET,
        salt: cookieName,
      });

      if (!decoded?.sub) {
        continue;
      }

      const expiresAt = new Date((decoded.exp ?? 0) * 1000);

      if (expiresAt.getTime() < Date.now()) {
        continue;
      }

      return {
        session: {
          id: typeof decoded.jti === "string" ? decoded.jti : token,
          token,
          userId: decoded.sub,
          expiresAt,
          ipAddress: null,
          userAgent: null,
          createdAt: expiresAt,
          updatedAt: expiresAt,
        },
        user: {
          id: decoded.sub,
          name: typeof decoded.name === "string" ? decoded.name : null,
          email: typeof decoded.email === "string" ? decoded.email : null,
          image: typeof decoded.picture === "string" ? decoded.picture : null,
          emailVerified: true,
          createdAt: expiresAt,
          updatedAt: expiresAt,
        },
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function createTRPCContext({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) {
  const cookieHeader = req.headers.get("cookie");
  const token = getCookie(cookieHeader, SESSION_COOKIE);

  async function getSession() {
    const nextAuthSession = await getNextAuthSession(cookieHeader);

    if (nextAuthSession) {
      return nextAuthSession;
    }

    if (!token) {
      return null;
    }

    try {
      const auth = await getAuthClient();
      return await auth.getSession(token);
    } catch {
      return null;
    }
  }

  return {
    req,
    resHeaders,
    token,
    getAuth: getAuthClient,
    getPrisma,
    getSession,
  };
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await ctx.getSession();

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return next({
    ctx: {
      session,
    },
  });
});

export const paidProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const prisma = await ctx.getPrisma();
  const userId = ctx.session.user.id;

  // Get user's org membership
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not part of any organization",
    });
  }

  const org = membership.organization;
  const EXPIRY_GRACE_MS = 60 * 60 * 1000; // 1 hour — matches scheduler, absorbs webhook/payment lag
  const isActive =
    org.plan !== "FREE" && org.planExpiresAt
      ? new Date(org.planExpiresAt).getTime() + EXPIRY_GRACE_MS > Date.now()
      : false;

  if (!isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your organization does not have an active paid plan",
    });
  }

  return next({
    ctx: {
      ...ctx,
      organizationId: org.id,
    },
  });
});
