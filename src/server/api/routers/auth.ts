import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";

import {
  createDeletedSessionCookie,
  createSessionCookie,
  SESSION_COOKIE,
} from "../cookies";
import { createTRPCRouter, publicProcedure } from "../trpc";

const signInInput = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const signUpInput = signInInput.extend({
  name: z.string().trim().min(1, "Name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const emailInput = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

const otpInput = emailInput.extend({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

const resetPasswordInput = otpInput.extend({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const OTP_LIMIT = 3;
const OTP_WINDOW_MS = 5 * 60 * 1000;
const AuthOtpRequestPurpose = {
  REGISTRATION: "REGISTRATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

type AuthOtpRequestPurpose =
  (typeof AuthOtpRequestPurpose)[keyof typeof AuthOtpRequestPurpose];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown-client"
  );
}

function formatRetryMessage(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Too many code requests. Please try again in ${minutes} minute${
    minutes === 1 ? "" : "s"
  }.`;
}

function toInternalError(error: unknown, fallbackMessage: string) {
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : fallbackMessage,
    cause: error,
  });
}

function toBadRequestError(error: unknown, fallbackMessage: string) {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: error instanceof Error ? error.message : fallbackMessage,
    cause: error,
  });
}

function isUnexpectedAuthFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /fetch failed|network|ECONN|ENOTFOUND|ETIMEDOUT|HTTP 5\d\d/i.test(
    error.message
  );
}

function isRateLimitAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /rate|limit|too many|429/i.test(error.message);
}

function toExpectedOrInternalAuthError(
  error: unknown,
  expectedMessage: string,
  internalMessage: string
) {
  if (isRateLimitAuthError(error)) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Too many code requests. Please wait a few minutes before requesting another code.",
      cause: error,
    });
  }

  if (isUnexpectedAuthFailure(error)) {
    return toInternalError(error, internalMessage);
  }

  return toBadRequestError(error, expectedMessage);
}

function toRateLimitOrInternalAuthError(
  error: unknown,
  internalMessage: string
) {
  if (isRateLimitAuthError(error)) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Too many code requests. Please wait a few minutes before requesting another code.",
      cause: error,
    });
  }

  return toInternalError(error, internalMessage);
}

async function reserveOtpRequest(
  prisma: PrismaClient,
  identifier: string,
  purpose: AuthOtpRequestPurpose
) {
  const windowStart = new Date(Date.now() - OTP_WINDOW_MS);
  const lockKey = `${purpose}:${identifier}`;

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
      `;

      const recentRequests = await tx.authOtpRequest.findMany({
        where: {
          identifier,
          purpose,
          createdAt: {
            gte: windowStart,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          createdAt: true,
        },
      });

      if (recentRequests.length >= OTP_LIMIT) {
        const retryAt = new Date(
          recentRequests[0].createdAt.getTime() + OTP_WINDOW_MS
        );
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((retryAt.getTime() - Date.now()) / 1000)
        );

        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: formatRetryMessage(retryAfterSeconds),
        });
      }

      const reservation = await tx.authOtpRequest.create({
        data: {
          identifier,
          purpose,
        },
        select: {
          id: true,
        },
      });

      return {
        reservationId: reservation.id,
        remaining: OTP_LIMIT - recentRequests.length - 1,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

async function releaseOtpRequest(prisma: PrismaClient, reservationId: string) {
  await prisma.authOtpRequest.deleteMany({
    where: {
      id: reservationId,
    },
  });
}

async function sendRateLimitedOtp<T>(
  ctx: {
    getPrisma: () => Promise<PrismaClient>;
    req: Request;
  },
  purpose: AuthOtpRequestPurpose,
  send: () => Promise<T>
) {
  const prisma = await ctx.getPrisma();
  const identifier = getClientIp(ctx.req);
  const { reservationId, remaining } = await reserveOtpRequest(
    prisma,
    identifier,
    purpose
  );

  try {
    const result = await send();
    return {
      result,
      remaining,
    };
  } catch (error) {
    if (!isUnexpectedAuthFailure(error)) {
      await releaseOtpRequest(prisma, reservationId);
    }

    throw error;
  }
}

export const authRouter = createTRPCRouter({
  session: publicProcedure.query(async ({ ctx }) => {
    return ctx.getSession();
  }),

  signIn: publicProcedure.input(signInInput).mutation(async ({ ctx, input }) => {
    try {
      const auth = await ctx.getAuth();
      const result = await auth.signInEmail({
        ...input,
        email: normalizeEmail(input.email),
      });
      const session = await auth.getSession(result.token);

      ctx.resHeaders.append(
        "Set-Cookie",
        createSessionCookie(result.token, session.session.expiresAt)
      );

      return { session };
    } catch (error) {
      throw toBadRequestError(error, "Unable to sign in.");
    }
  }),

  signUp: publicProcedure.input(signUpInput).mutation(async ({ ctx, input }) => {
    const email = normalizeEmail(input.email);

    try {
      const auth = await ctx.getAuth();
      const { remaining } = await sendRateLimitedOtp(
        ctx,
        AuthOtpRequestPurpose.REGISTRATION,
        () =>
          auth.signUpEmail({
            ...input,
            email,
          })
      );

      return {
        email,
        awaitingVerification: true,
        remaining,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw toExpectedOrInternalAuthError(
        error,
        "Unable to sign up.",
        "Unable to sign up."
      );
    }
  }),

  verifyEmailOtp: publicProcedure
    .input(otpInput)
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);

      try {
        const auth = await ctx.getAuth();
        const result = await auth.verifyEmailOtp({
          email,
          otp: input.otp,
        });
        const session = await auth.getSession(result.token);

        ctx.resHeaders.append(
          "Set-Cookie",
          createSessionCookie(result.token, session.session.expiresAt)
        );

        return { session };
      } catch (error) {
        throw toExpectedOrInternalAuthError(
          error,
          "Unable to verify this code.",
          "Unable to verify this code."
        );
      }
    }),

  resendVerificationOtp: publicProcedure
    .input(emailInput)
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);

      try {
        const auth = await ctx.getAuth();
        const { remaining } = await sendRateLimitedOtp(
          ctx,
          AuthOtpRequestPurpose.REGISTRATION,
          () => auth.resendVerificationOtp({ email })
        );

        return {
          ok: true,
          remaining,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw toExpectedOrInternalAuthError(
          error,
          "Unable to resend verification code.",
          "Unable to resend verification code."
        );
      }
    }),

  requestPasswordReset: publicProcedure
    .input(emailInput)
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);

      try {
        const auth = await ctx.getAuth();
        const { remaining } = await sendRateLimitedOtp(
          ctx,
          AuthOtpRequestPurpose.PASSWORD_RESET,
          () => auth.requestPasswordReset({ email })
        );

        return {
          ok: true,
          email,
          remaining,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw toRateLimitOrInternalAuthError(
          error,
          "Unable to request password reset."
        );
      }
    }),

  resetPasswordWithOtp: publicProcedure
    .input(resetPasswordInput)
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);

      try {
        const auth = await ctx.getAuth();
        await auth.resetPasswordWithOtp({
          email,
          otp: input.otp,
          password: input.password,
        });

        return { ok: true };
      } catch (error) {
        throw toExpectedOrInternalAuthError(
          error,
          "Unable to reset password.",
          "Unable to reset password."
        );
      }
    }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    try {
      if (ctx.token) {
        const auth = await ctx.getAuth();
        await auth.signOut(ctx.token);
      }

      ctx.resHeaders.append("Set-Cookie", createDeletedSessionCookie());

      return { ok: true };
    } catch (error) {
      ctx.resHeaders.append("Set-Cookie", createDeletedSessionCookie());

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unable to sign out.",
        cause: error,
      });
    }
  }),
});

export { SESSION_COOKIE };
