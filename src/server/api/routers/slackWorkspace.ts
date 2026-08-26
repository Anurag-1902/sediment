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
      clientId: workspace.clientIdEnc ? decrypt(workspace.clientIdEnc) : null,
      hasClientId: Boolean(workspace.clientIdEnc),
      hasClientSecret: Boolean(workspace.clientSecretEnc),
      hasSigningSecret: Boolean(workspace.signingSecretEnc),
      hasBotToken: Boolean(workspace.botTokenEnc),
    };
  }),

  save: protectedProcedure
    .input(
      z.object({
        workspaceName: z.string().optional().default("My Workspace"),
        clientId: z.string().min(1),
        clientSecret: z.string(),
        signingSecret: z.string(),
        botToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const existing = await prisma.slackWorkspace.findUnique({
        where: { userId },
      });

      // Only encrypt and update secrets that were actually provided
      const encrypted: Record<string, string> = {
        clientIdEnc: encrypt(input.clientId),
      };
      if (input.clientSecret) encrypted.clientSecretEnc = encrypt(input.clientSecret);
      if (input.signingSecret) encrypted.signingSecretEnc = encrypt(input.signingSecret);
      if (input.botToken) encrypted.botTokenEnc = encrypt(input.botToken);

      // For new workspaces, require all fields
      if (!existing) {
        if (!input.clientSecret || !input.signingSecret || !input.botToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "All credentials are required for initial setup",
          });
        }
      }

      const workspace = await prisma.slackWorkspace.upsert({
        where: { userId },
        update: {
          workspaceName: input.workspaceName,
          ...encrypted,
        },
        create: {
          userId,
          workspaceName: input.workspaceName,
          clientIdEnc: encrypted.clientIdEnc,
          clientSecretEnc: encrypted.clientSecretEnc!,
          signingSecretEnc: encrypted.signingSecretEnc!,
          botTokenEnc: encrypted.botTokenEnc!,
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

      await prisma.slackWorkspace.update({
        where: { userId },
        data: {
          workspaceId: result.team_id ?? undefined,
          botUserId: result.user_id ?? undefined,
        },
      });

      return {
        ok: true,
        teamName: result.team ?? "Unknown",
        workspaceId: result.team_id ?? null,
        botUserId: result.user_id ?? null,
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
