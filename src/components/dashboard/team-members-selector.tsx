"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleSelector } from "@/components/ui/role-selector";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

type WorkspaceUser = {
  id: string;
  name: string;
  realName: string;
  displayName?: string | undefined;
  avatarUrl: string | null;
};

interface TeamMembersSelectorProps {
  value: { handle: string; role: string }[];
  onChange: (members: { handle: string; role: string }[]) => void;
  hasSlackConnected: boolean;
}

export function TeamMembersSelector({
  value,
  onChange,
  hasSlackConnected,
}: TeamMembersSelectorProps) {
  const [memberSearch, setMemberSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddById, setShowAddById] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState("");

  const { data: workspaceUsers, error: usersError } = trpc.slack.users.useQuery(
    undefined,
    {
      enabled: hasSlackConnected,
      staleTime: 5 * 60 * 1000,
    }
  );

  const isSlackNotConnected =
    usersError?.data?.code === "PRECONDITION_FAILED";

  const fuse = useMemo(() => {
    if (!workspaceUsers) return null;
    return new Fuse(workspaceUsers, {
      keys: [
        { name: "realName", weight: 0.5 },
        { name: "name", weight: 0.3 },
        { name: "displayName", weight: 0.2 },
      ],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 1,
      includeScore: true,
      ignoreLocation: true,
    });
  }, [workspaceUsers]);

  const handleRemoveMember = (handle: string) => {
    onChange(value.filter((m) => m.handle !== handle));
  };

  const handleUpdateRole = (handle: string, role: string) => {
    onChange(
      value.map((m) => (m.handle === handle ? { ...m, role } : m))
    );
  };

  const handleAddMember = () => {
    const trimmed = newMemberInput.trim();
    if (!trimmed) return;
    if (value.some((m) => m.handle === trimmed)) {
      toast.error("Member already added");
      return;
    }
    onChange([...value, { handle: trimmed, role: "Developer" }]);
    setNewMemberInput("");
  };

  const handleToggleUser = (userId: string) => {
    const existing = value.find((m) => m.handle === userId);
    if (existing) {
      onChange(value.filter((m) => m.handle !== userId));
    } else {
      onChange([...value, { handle: userId, role: "Developer" }]);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!workspaceUsers) return [];
    if (!memberSearch.trim()) return workspaceUsers;
    if (!fuse) return workspaceUsers;
    return fuse.search(memberSearch.trim()).map((result) => result.item);
  }, [workspaceUsers, memberSearch, fuse]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Team Members</h3>
      <p className="text-xs text-text-muted">
        Only members listed here can post standup updates. Select workspace
        users from the dropdown below.
      </p>

      {isSlackNotConnected || !hasSlackConnected ? (
        <div className="rounded-xl border-2 border-amber p-4 text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10">
              <MessageSquare className="h-5 w-5 text-amber" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">
              Connect your Slack workspace
            </h3>
            <p className="text-xs text-text-muted mt-1">
              To select team members, connect your Slack account first.
            </p>
          </div>
          <Link href="/dashboard/settings/slack">
            <Button
              size="sm"
              className="bg-amber hover:bg-amber-light text-charcoal font-medium"
            >
              Connect Slack Account
            </Button>
          </Link>
        </div>
      ) : (
        <div className="relative">
          <div
            className="bg-charcoal border border-border rounded-lg cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="px-3 py-2 text-sm text-text-muted">
              {dropdownOpen
                ? "Close member list"
                : "Select workspace members..."}
            </div>
          </div>

          {dropdownOpen && (
            <div
              className="absolute z-50 w-full mt-1 bg-charcoal border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "360px" }}
            >
              <div className="p-2 border-b border-border shrink-0">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members..."
                  className="w-full bg-transparent border-0 border-b border-border focus:border-amber text-sm text-text placeholder:text-text-muted outline-none pb-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div
                className="flex-1 overflow-y-auto divide-y divide-border scrollbar-thin"
                style={{ maxHeight: "300px" }}
              >
                {!workspaceUsers ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </div>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-text-muted text-center">
                    No members found.
                  </div>
                ) : (
                  filteredUsers.map((user: WorkspaceUser) => {
                    const isSelected = value.some((m) => m.handle === user.id);
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-raised ${
                          isSelected ? "bg-amber/5" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleUser(user.id);
                        }}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-amber/20 flex items-center justify-center text-xs font-medium text-amber">
                            {user.realName
                              .split(" ")
                              .map((n: string) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text truncate">
                            {user.realName}
                          </div>
                          <div className="text-xs text-text-muted truncate">
                            @{user.name}
                          </div>
                        </div>
                        <Checkbox checked={isSelected} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 mt-3">
        {value.map((m) => {
          const user = workspaceUsers?.find(
            (u: WorkspaceUser) => u.id === m.handle
          );
          const label = user?.realName ?? user?.name ?? m.handle;
          return (
            <div key={m.handle} className="flex items-center gap-3 p-2 rounded-lg border border-border-custom">
              <span className="flex-1 text-sm text-text">{label}</span>
              <RoleSelector
                value={m.role}
                onChange={(newRole) => handleUpdateRole(m.handle, newRole)}
                className="w-44"
              />
              <button
                type="button"
                onClick={() => handleRemoveMember(m.handle)}
                className="text-text-muted hover:text-red-400 text-sm px-2"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowAddById(!showAddById)}
          className="text-xs text-text-muted hover:text-text underline"
        >
          {showAddById ? "Hide" : "Add by ID"}
        </button>
        {showAddById && (
          <div className="flex gap-2 mt-2">
            <Input
              value={newMemberInput}
              onChange={(e) => setNewMemberInput(e.target.value)}
              placeholder="Add Slack user ID (e.g. U08ABCDEFG)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddMember}>
              + Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
