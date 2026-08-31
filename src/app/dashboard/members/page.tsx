"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Shield } from "lucide-react";

const ROLES = [
  { value: "MANAGER", label: "Manager", description: "Full access including billing" },
  { value: "ADMIN", label: "Admin", description: "Manage projects and members" },
  { value: "DEVELOPER", label: "Developer", description: "View projects, submit updates" },
  { value: "HR", label: "HR", description: "View all projects for reporting" },
  { value: "ACCOUNTANT", label: "Accountant", description: "View billing only" },
  { value: "FINANCE", label: "Finance", description: "View billing only" },
  { value: "EMPLOYEE", label: "Employee", description: "Basic project access" },
];

export default function MembersPage() {
  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.organization.listMembers.useQuery();
  const { data: currentRole } = trpc.organization.currentUserRole.useQuery();
  const { data: pendingInvites } = trpc.organization.listPendingInvites.useQuery();

  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const updateRole = trpc.organization.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated!");
      utils.organization.listMembers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.organization.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      setConfirmRemoveId(null);
      utils.organization.listMembers.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
      setConfirmRemoveId(null);
    },
  });

  const cancelInvite = trpc.organization.cancelInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite cancelled");
      utils.organization.listPendingInvites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resendInvite = trpc.organization.resendInvite.useMutation({
    onSuccess: () => toast.success("Invite email resent"),
    onError: (err) => toast.error(err.message),
  });

  const canManage = currentRole?.role === "MANAGER" || currentRole?.role === "ADMIN";
  const canChangeRoles = currentRole?.role === "MANAGER";

  if (isLoading) return <div className="p-8 text-text-muted">Loading members...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Team Members</h1>
        <p className="text-text-muted mt-1">Manage who has access to your organization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {members?.length ?? 0} member{members?.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border-custom"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber/20 flex items-center justify-center text-amber font-semibold">
                  {member.user.name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="font-medium text-text">{member.user.name}</p>
                  <p className="text-xs text-text-muted">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canChangeRoles && member.userId !== currentRole?.organizationId ? (
                  <Select
                    value={member.role}
                    onValueChange={(newRole) =>
                      updateRole.mutate({ memberId: member.id, role: newRole as any })
                    }
                    disabled={updateRole.isPending}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber/15 text-amber border border-amber/30 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {ROLES.find((r) => r.value === member.role)?.label ?? member.role}
                  </span>
                )}

                {canManage && (
                  <>
                    {confirmRemoveId === member.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeMember.mutate({ memberId: member.id })}
                          disabled={removeMember.isPending}
                          className="text-xs font-medium rounded px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          {removeMember.isPending ? "..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="text-xs text-text-muted hover:text-text px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(member.id)}
                        className="p-2 text-text-muted hover:text-red-400 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {pendingInvites && pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites ({pendingInvites.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border-custom"
              >
                <div>
                  <p className="font-medium text-text">{invite.email}</p>
                  <p className="text-xs text-text-muted">
                    Invited as {invite.role} · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const baseUrl = window.location.origin;
                        const link = `${baseUrl}/invite/${invite.token}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Invite link copied!");
                      }}
                      className="text-xs font-medium px-3 py-1 rounded border border-amber/30 text-amber hover:bg-amber/10 transition-colors"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => resendInvite.mutate({ inviteId: invite.id })}
                      disabled={resendInvite.isPending}
                      className="text-xs font-medium px-3 py-1 rounded border border-border-custom hover:bg-surface-raised transition-colors"
                    >
                      Resend
                    </button>
                    <button
                      onClick={() => cancelInvite.mutate({ inviteId: invite.id })}
                      disabled={cancelInvite.isPending}
                      className="text-xs font-medium px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
