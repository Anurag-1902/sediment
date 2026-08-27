"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function OnboardingPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const utils = trpc.useUtils();

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: () => {
      toast.success("Organization created!");
      utils.invalidate();
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const joinOrg = trpc.organization.join.useMutation({
    onSuccess: () => {
      toast.success("Joined organization!");
      utils.invalidate();
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Please enter an organization name");
      return;
    }
    createOrg.mutate({ name: orgName.trim() });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }
    joinOrg.mutate({ inviteCode: inviteCode.trim() });
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">Welcome to Sediment</h1>
          <p className="text-text-muted mt-2">
            Set up your team to start running async standups
          </p>
        </div>

        <div className="rounded-2xl border border-border-custom bg-surface p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-text mb-2">
              Create a new team
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Start your own organization and invite team members
            </p>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="e.g. Acme Inc"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-charcoal border-border-custom"
              />
              <Button
                type="submit"
                disabled={createOrg.isPending}
                className="w-full bg-amber text-charcoal hover:bg-amber-light font-semibold"
              >
                {createOrg.isPending ? "Creating..." : "Create Team"}
              </Button>
            </form>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-custom" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-text-muted">or</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text mb-2">
              Join an existing team
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Enter an invite code to join a team
            </p>
            <form onSubmit={handleJoin} className="space-y-3">
              <Input
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="bg-charcoal border-border-custom"
              />
              <Button
                type="submit"
                disabled={joinOrg.isPending}
                variant="outline"
                className="w-full border-border-custom text-text hover:bg-surface-raised"
              >
                {joinOrg.isPending ? "Joining..." : "Join Team"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
