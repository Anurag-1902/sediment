"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, MailQuestion } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const {
    requestPasswordReset,
    isRequestingPasswordReset,
    resetPasswordWithOtp,
    isResettingPasswordWithOtp,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAwaitingCode, setIsAwaitingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpRequestsRemaining, setOtpRequestsRemaining] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const id = window.setInterval(() => {
      setResendCooldown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(id);
  }, [resendCooldown]);

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const result = await requestPasswordReset({ email });
      setResetEmail(result.email);
      setIsAwaitingCode(true);
      setOtpRequestsRemaining(result.remaining);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Toast is handled by the auth hook.
    }
  };

  const handleResend = async () => {
    try {
      const result = await requestPasswordReset({ email: resetEmail });
      setOtpRequestsRemaining(result.remaining);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Toast is handled by the auth hook.
    }
  };

  const handleResetPassword = (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      return;
    }

    resetPasswordWithOtp({
      email: resetEmail,
      otp,
      password,
    });
  };

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <AuthCard
      title={isAwaitingCode ? "Set a new password" : "Reset password"}
      description={
        isAwaitingCode
          ? `Enter the 6-digit code sent to ${resetEmail}.`
          : "Enter your email and we will send a reset code if the account can receive one."
      }
      icon={
        isAwaitingCode ? (
          <KeyRound className="size-5" />
        ) : (
          <MailQuestion className="size-5" />
        )
      }
      currentStep={isAwaitingCode ? 2 : 1}
      steps={["Email", "Reset"]}
      backHref="/sign-in"
      backLabel="Sign in"
      footer={
        <div className="text-center text-sm text-text-muted">
          {isAwaitingCode ? (
            otpRequestsRemaining === null ? (
              "The newest reset code replaces any earlier code."
            ) : (
              `${otpRequestsRemaining} code request${
                otpRequestsRemaining === 1 ? "" : "s"
              } left in the current 5-minute window.`
            )
          ) : (
            <>
              Remembered your password?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-text underline underline-offset-4 hover:text-amber"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      }
    >
      {isAwaitingCode ? (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="rounded-xl border border-border-custom bg-surface-raised p-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-text">Reset code</Label>
              <InputOTP
                id="otp"
                maxLength={6}
                value={otp}
                onChange={setOtp}
                containerClassName="justify-center"
                disabled={isResettingPasswordWithOtp}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="size-10 border-border-custom bg-charcoal text-base text-text"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 border-border-custom bg-charcoal text-text placeholder:text-text-muted focus-visible:ring-amber"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-text">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 border-border-custom bg-charcoal text-text placeholder:text-text-muted focus-visible:ring-amber"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={passwordMismatch}
            />
            {passwordMismatch ? (
              <p className="text-sm text-rose-400">
                Passwords do not match.
              </p>
            ) : (
              <p className="text-sm text-text-muted">
                Use at least 8 characters.
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-amber font-semibold text-charcoal hover:bg-amber-light"
            disabled={
              otp.length !== 6 ||
              password.length < 8 ||
              password !== confirmPassword ||
              isResettingPasswordWithOtp
            }
          >
            {isResettingPasswordWithOtp
              ? "Resetting password..."
              : "Reset Password"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-border-custom text-text hover:bg-surface-raised hover:text-text"
            disabled={resendCooldown > 0 || isRequestingPasswordReset}
            onClick={handleResend}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : isRequestingPasswordReset
                ? "Sending..."
                : "Resend code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              autoComplete="email"
              className="h-10 border-border-custom bg-charcoal text-text placeholder:text-text-muted focus-visible:ring-amber"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-amber font-semibold text-charcoal hover:bg-amber-light"
            disabled={isRequestingPasswordReset}
          >
            {isRequestingPasswordReset ? "Sending..." : "Send Reset Code"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
