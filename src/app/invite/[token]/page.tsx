"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect } from "react";
import Link from "next/link";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const token = params.token as string;
  const utils = trpc.useUtils();

  const acceptInvite = trpc.organization.acceptInvite.useMutation({
    onSuccess: async () => {
      toast.success("Welcome to the team!");
      await utils.invalidate();
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const declineInvite = trpc.organization.declineInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite declined");
      router.push("/");
    },
    onError: (err) => toast.error(err.message),
  });

  // If not logged in, redirect to sign-in with the invite token in the return URL
  useEffect(() => {
    if (!isLoading && !session) {
      router.push(`/sign-in?redirect=/invite/${token}`);
    }
  }, [isLoading, session, token, router]);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>You&apos;ve been invited to Sediment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-muted">
            Someone has invited you to join their organization on Sediment. Accepting will give you access to their team&apos;s projects, standups, and analytics.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => acceptInvite.mutate({ token })}
              disabled={acceptInvite.isPending || declineInvite.isPending}
              className="flex-1 bg-amber text-charcoal hover:bg-amber-light font-semibold"
            >
              {acceptInvite.isPending ? "Accepting..." : "Accept Invite"}
            </Button>
            <Button
              onClick={() => declineInvite.mutate({ token })}
              disabled={acceptInvite.isPending || declineInvite.isPending}
              variant="outline"
              className="flex-1"
            >
              Decline
            </Button>
          </div>
          <p className="text-xs text-text-muted text-center">
            Signed in as {session.user.email}. Not you?{" "}
            <Link href="/sign-out" className="text-amber hover:underline">Sign out</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
