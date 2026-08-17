"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  const { signIn, isSigningIn } = useAuth();
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

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in with your email and password to continue."
      icon={<LogIn className="size-5" />}
      footer={
        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Create account
          </Link>
        </div>
      }
    >
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
      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
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
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSigningIn}
        >
          {isSigningIn ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthCard>
  );
}
