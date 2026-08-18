import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getChannelList, resolveSlackUser } from "@/server/slack";

export const slackRouter = createTRPCRouter({
  channels: protectedProcedure.query(async ({ ctx }) => {
    const channels = await getChannelList(ctx.session.user.id);
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
