import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, paidProcedure } from "../trpc";
import { getChannelList, resolveSlackUser, getSlackConfigForOrg, getSlackClientForOrg } from "@/server/slack";

export const slackRouter = createTRPCRouter({
  channels: paidProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      select: { organizationId: true },
    });
    const organizationId = membership?.organizationId;
    if (!organizationId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No organization found",
      });
    }
    const config = await getSlackConfigForOrg(organizationId);

    if (!config) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Slack not connected. Please connect your Slack account first.",
      });
    }

    const channels = await getChannelList(organizationId);
    return channels
      .filter((c) => !c.is_archived)
      .map((c) => ({ id: c.id, name: c.name }));
  }),

  users: paidProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;
    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      select: { organizationId: true },
    });
    const organizationId = membership?.organizationId;
    if (!organizationId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No organization found",
      });
    }
    const config = await getSlackConfigForOrg(organizationId);
    if (!config) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Slack not connected. Please connect your Slack account first.",
      });
    }
    const client = await getSlackClientForOrg(organizationId);
    const result = await client.users.list({ limit: 1000 });
    const members = (result.members ?? []) as Array<{
      id: string;
      name: string;
      real_name?: string;
      deleted?: boolean;
      is_bot?: boolean;
      profile?: {
        real_name?: string;
        display_name?: string;
        image_48?: string;
        email?: string;
      };
    }>;
    return members
      .filter(m => !m.deleted && !m.is_bot && m.id !== "USLACKBOT")
      .map(m => ({
        id: m.id,
        name: m.name,
        realName: m.profile?.real_name ?? m.real_name ?? m.name,
        displayName: m.profile?.display_name || undefined,
        avatarUrl: m.profile?.image_48 ?? null,
      }))
      .sort((a, b) => a.realName.localeCompare(b.realName));
  }),

  resolveUser: paidProcedure
    .input(z.object({ handle: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const membership = await prisma.organizationMember.findFirst({
        where: { userId },
        select: { organizationId: true },
      });
      const organizationId = membership?.organizationId;
      const user = organizationId ? await resolveSlackUser(input.handle, organizationId) : null;
      if (!user) return null;
      return { id: user.id, name: user.name, realName: user.realName };
    }),
});
