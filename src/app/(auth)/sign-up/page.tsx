"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { MailCheck, UserPlus } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const RESEND_COOLDOWN_SECONDS = 30;

export default function SignUpPage() {
  const {
    signUp,
    isSigningUp,
    verifyEmailOtp,
    isVerifyingEmailOtp,
    resendVerificationOtp,
    isResendingVerificationOtp,
  } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signUp({ name, email, password });
      setVerificationEmail(result.email);
      setIsAwaitingVerification(result.awaitingVerification);
      setOtpRequestsRemaining(result.remaining);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Toast is handled by the auth hook.
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyEmailOtp({ email: verificationEmail, otp });
  };

  const handleResend = async () => {
    try {
      const result = await resendVerificationOtp({ email: verificationEmail });
      setOtpRequestsRemaining(result.remaining);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Toast is handled by the auth hook.
    }
  };

  return (
    <AuthCard
      title={isAwaitingVerification ? "Check your inbox" : "Create account"}
      description={
        isAwaitingVerification
          ? `We sent a 6-digit verification code to ${verificationEmail}.`
          : "Start with your name, email, and a secure password."
      }
      icon={
        isAwaitingVerification ? (
          <MailCheck className="size-5" />
        ) : (
          <UserPlus className="size-5" />
        )
      }
      currentStep={isAwaitingVerification ? 2 : 1}
      steps={["Account", "Verify"]}
      footer={
        isAwaitingVerification ? (
          <p className="text-center text-sm text-muted-foreground">
            Wrong email? Refresh this page and create the account again with the
            correct address.
          </p>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </div>
        )
      }
    >
      {isAwaitingVerification ? (
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="rounded-xl border bg-muted/35 p-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <InputOTP
                id="otp"
                maxLength={6}
                value={otp}
                onChange={setOtp}
                containerClassName="justify-center"
                disabled={isVerifyingEmailOtp}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="size-10 bg-background text-base"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className="text-center text-sm text-muted-foreground">
                {otpRequestsRemaining === null
                  ? "The newest code replaces any earlier code."
                  : `${otpRequestsRemaining} code request${
                      otpRequestsRemaining === 1 ? "" : "s"
                    } left in the current 5-minute window.`}
              </p>
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={otp.length !== 6 || isVerifyingEmailOtp}
          >
            {isVerifyingEmailOtp ? "Verifying..." : "Verify and Sign In"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={resendCooldown > 0 || isResendingVerificationOtp}
            onClick={handleResend}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : isResendingVerificationOtp
                ? "Sending..."
                : "Resend code"}
          </Button>
        </form>
      ) : (
        <>
          <div className="space-y-5">
            <GoogleAuthButton />
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs font-medium uppercase text-muted-foreground">
                or
              </span>
              <Separator className="flex-1" />
            </div>
          </div>
          <form onSubmit={handleSignUp} className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                required
                autoComplete="name"
                className="h-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Use at least 8 characters.
              </p>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSigningUp}
            >
              {isSigningUp ? "Creating account..." : "Continue"}
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
