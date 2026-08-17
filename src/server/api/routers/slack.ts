import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getChannelList, resolveSlackUser } from "@/server/slack";

export const slackRouter = createTRPCRouter({
  channels: protectedProcedure.query(async () => {
    const channels = await getChannelList();
    return channels
      .filter((c) => !c.is_archived)
      .map((c) => ({ id: c.id, name: c.name }));
  }),

  resolveUser: protectedProcedure
    .input(z.object({ handle: z.string() }))
    .mutation(async ({ input }) => {
      const user = await resolveSlackUser(input.handle);
      if (!user) return null;
      return { id: user.id, name: user.name, realName: user.realName };
    }),
});
