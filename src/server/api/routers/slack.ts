import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getChannelList, resolveSlackUser, getSlackConfigForUser } from "@/server/slack";

export const slackRouter = createTRPCRouter({
  channels: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const config = await getSlackConfigForUser(userId);

    if (!config) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Slack not connected. Please connect your Slack account first.",
      });
    }

    const channels = await getChannelList(userId);
    return channels
      .filter((c) => !c.is_archived)
      .map((c) => ({ id: c.id, name: c.name }));
  }),

  resolveUser: protectedProcedure
    .input(z.object({ handle: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await resolveSlackUser(input.handle, ctx.session.user.id);
      if (!user) return null;
      return { id: user.id, name: user.name, realName: user.realName };
    }),
});
