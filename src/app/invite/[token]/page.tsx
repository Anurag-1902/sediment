"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [accepted, setAccepted] = useState(false);

  const acceptInvite = trpc.organization.acceptInvite.useMutation({
    onSuccess: (data) => {
      setAccepted(true);
      toast.success(`You've joined ${data.organizationName}!`);
      setTimeout(() => router.push("/dashboard"), 2000);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (!authLoading && !session) {
      // Redirect to sign-in, then come back
      router.push(`/sign-in?redirect=/invite/${params.token}`);
    }
  }, [authLoading, session, router, params.token]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-charcoal flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </main>
    );
  }

  if (accepted) {
    return (
      <main className="min-h-screen bg-charcoal flex items-center justify-center px-4">
        <div className="rounded-2xl border border-amber/30 bg-surface p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-text mb-2">You're in!</h1>
          <p className="text-text-muted">Redirecting to your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="rounded-2xl border border-border-custom bg-surface p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-text mb-4">Accept Invite</h1>
        <p className="text-text-muted mb-6">
          You've been invited to join a team on Sediment.
        </p>
        <button
          onClick={() => acceptInvite.mutate({ token: params.token as string })}
          disabled={acceptInvite.isPending}
          className="w-full rounded-lg bg-amber text-charcoal py-3 text-sm font-semibold hover:bg-amber-light transition-colors"
        >
          {acceptInvite.isPending ? "Joining..." : "Accept & Join Team"}
        </button>
      </div>
    </main>
  );
}
