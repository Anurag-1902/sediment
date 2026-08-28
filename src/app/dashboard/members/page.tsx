"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Trash2, Shield } from "lucide-react";

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

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("EMPLOYEE");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const inviteMember = trpc.organization.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Member invited!");
      setInviteEmail("");
      utils.organization.listMembers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

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

  const canManage = currentRole?.role === "MANAGER" || currentRole?.role === "ADMIN";
  const canChangeRoles = currentRole?.role === "MANAGER";

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email");
      return;
    }
    inviteMember.mutate({ email: inviteEmail.trim(), role: inviteRole as any });
  };

  if (isLoading) return <div className="p-8 text-text-muted">Loading members...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Team Members</h1>
        <p className="text-text-muted mt-1">Manage who has access to your organization</p>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite a member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "EMPLOYEE")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                        disabled={r.value === "MANAGER" && currentRole?.role !== "MANAGER"}
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={inviteMember.isPending}>
                  {inviteMember.isPending ? "Inviting..." : "Invite"}
                </Button>
              </div>
              <p className="text-xs text-text-muted">
                The person must already have a Sediment account. They'll be added to your organization immediately.
              </p>
            </form>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
