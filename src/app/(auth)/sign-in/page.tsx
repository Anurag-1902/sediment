"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { GoogleAuthButtonWithRedirect } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  const { signIn, isSigningIn } = useAuth();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") ?? undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get("google") !== "failed") {
      return;
    }

    toast.error("Unable to sign in with Google.");
    url.searchParams.delete("google");
    window.history.replaceState(null, "", url.toString());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ email, password });
  };

  const signUpHref = redirectParam
    ? `/sign-up?redirect=${encodeURIComponent(redirectParam)}`
    : "/sign-up";

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in with your email and password to continue."
      icon={<LogIn className="size-5" />}
      footer={
        <div className="text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href={signUpHref}
            className="font-medium text-text underline underline-offset-4 hover:text-amber"
          >
            Create account
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <GoogleAuthButtonWithRedirect redirect={redirectParam} />
        <div className="flex items-center gap-3">
          <Separator className="flex-1 bg-border-custom" />
          <span className="text-xs font-medium uppercase text-text-muted">
            or
          </span>
          <Separator className="flex-1 bg-border-custom" />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
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
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-text">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-text-muted underline underline-offset-4 hover:text-text"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-10 border-border-custom bg-charcoal text-text placeholder:text-text-muted focus-visible:ring-amber"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full bg-amber font-semibold text-charcoal hover:bg-amber-light"
          disabled={isSigningIn}
        >
          {isSigningIn ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthCard>
  );
}
