import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

import { getAuthClient, getPrisma } from "@/lib/krutai-server";
import { getCookie, SESSION_COOKIE } from "./cookies";

export async function createTRPCContext({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) {
  const token = getCookie(req.headers.get("cookie"), SESSION_COOKIE);

  async function getSession() {
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
