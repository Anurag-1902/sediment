import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { encrypt, decrypt } from "@/lib/crypto";
import { WebClient } from "@slack/web-api";

export const slackWorkspaceRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const workspace = await prisma.slackWorkspace.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!workspace) return null;

    return {
      workspaceName: workspace.workspaceName,
      workspaceId: workspace.workspaceId,
      botUserId: workspace.botUserId,
      hasClientId: Boolean(workspace.clientIdEnc),
      hasClientSecret: Boolean(workspace.clientSecretEnc),
      hasSigningSecret: Boolean(workspace.signingSecretEnc),
      hasBotToken: Boolean(workspace.botTokenEnc),
    };
  }),

  save: protectedProcedure
    .input(
      z.object({
        workspaceName: z.string().min(1),
        clientId: z.string().min(1),
        clientSecret: z.string().min(1),
        signingSecret: z.string().min(1),
        botToken: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const encrypted = {
        clientIdEnc: encrypt(input.clientId),
        clientSecretEnc: encrypt(input.clientSecret),
        signingSecretEnc: encrypt(input.signingSecret),
        botTokenEnc: encrypt(input.botToken),
      };

      const workspace = await prisma.slackWorkspace.upsert({
        where: { userId },
        update: {
          workspaceName: input.workspaceName,
          ...encrypted,
        },
        create: {
          userId,
          workspaceName: input.workspaceName,
          ...encrypted,
        },
      });

      return {
        id: workspace.id,
        workspaceName: workspace.workspaceName,
      };
    }),

  test: protectedProcedure.mutation(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;

    const workspace = await prisma.slackWorkspace.findUnique({
      where: { userId },
    });

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No Slack workspace configured",
      });
    }

    const botToken = decrypt(workspace.botTokenEnc);
    const client = new WebClient(botToken);

    try {
      const result = await client.auth.test();
      if (!result.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: (result.error as string) || "Slack auth.test failed",
        });
      }

      const teamName = result.team ?? "";
      const workspaceId = result.team_id ?? "";
      const botUserId = result.user_id ?? "";

      await prisma.slackWorkspace.update({
        where: { userId },
        data: {
          workspaceId,
          botUserId,
        },
      });

      return {
        ok: true,
        workspaceId,
        botUserId,
        teamName,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new TRPCError({
        code: "BAD_REQUEST",
        message,
      });
    }
  }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;

    await prisma.slackWorkspace.deleteMany({
      where: { userId },
    });

    return { success: true };
  }),
});
