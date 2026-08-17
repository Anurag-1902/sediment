import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const usersRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const prisma = await ctx.getPrisma();

      return prisma.user.findMany({
        include: {
          sessions: true,
        },
      });
    } catch (error) {
      console.error("Prisma Error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch users",
        cause: error,
      });
    }
  }),
});
