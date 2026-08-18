import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AuthSession } from "@krutai/auth";

import { trpc } from "@/lib/trpc";

export function useAuth() {
  const utils = trpc.useUtils();
  const router = useRouter();
  const [sessionQueryEnabled, setSessionQueryEnabled] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setSessionQueryEnabled(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const { data, isLoading: isSessionLoading } = trpc.auth.session.useQuery(
    undefined,
    {
      enabled: sessionQueryEnabled,
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const session = data as AuthSession | null | undefined;

const signInMutation = trpc.auth.signIn.useMutation({
    onSuccess: () => {
      toast.success("Signed in successfully");
      utils.auth.session.invalidate();
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      router.push(redirect ?? "/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Verification code sent. ${data.remaining} request${
          data.remaining === 1 ? "" : "s"
        } left.`
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyEmailOtpMutation = trpc.auth.verifyEmailOtp.useMutation({
    onSuccess: () => {
      toast.success("Email verified successfully");
      utils.auth.session.invalidate();
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      router.push(redirect ?? "/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resendVerificationOtpMutation =
    trpc.auth.resendVerificationOtp.useMutation({
      onSuccess: (data) => {
        toast.success(
          `Verification code sent. ${data.remaining} request${
            data.remaining === 1 ? "" : "s"
          } left.`
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const requestPasswordResetMutation =
    trpc.auth.requestPasswordReset.useMutation({
      onSuccess: (data) => {
        toast.success(
          `If that email can receive a reset code, one was sent. ${data.remaining} request${
            data.remaining === 1 ? "" : "s"
          } left.`
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const resetPasswordWithOtpMutation =
    trpc.auth.resetPasswordWithOtp.useMutation({
      onSuccess: () => {
        toast.success("Password reset successfully");
        router.push("/sign-in");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      utils.auth.session.invalidate();
      router.push("/sign-in");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    session,
    isLoading: sessionQueryEnabled && isSessionLoading,
    signIn: signInMutation.mutate,
    isSigningIn: signInMutation.isPending,
    signUp: signUpMutation.mutateAsync,
    isSigningUp: signUpMutation.isPending,
    verifyEmailOtp: verifyEmailOtpMutation.mutate,
    isVerifyingEmailOtp: verifyEmailOtpMutation.isPending,
    resendVerificationOtp: resendVerificationOtpMutation.mutateAsync,
    isResendingVerificationOtp: resendVerificationOtpMutation.isPending,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    isRequestingPasswordReset: requestPasswordResetMutation.isPending,
    resetPasswordWithOtp: resetPasswordWithOtpMutation.mutate,
    isResettingPasswordWithOtp: resetPasswordWithOtpMutation.isPending,
    signOut: signOutMutation.mutate,
    isSigningOut: signOutMutation.isPending,
  };
}
