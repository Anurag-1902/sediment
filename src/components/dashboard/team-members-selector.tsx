"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
  value: string[];
  onChange: (ids: string[]) => void;
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

  const handleRemoveMember = (handle: string) => {
    onChange(value.filter((h) => h !== handle));
  };

  const handleAddMember = () => {
    const trimmed = newMemberInput.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      toast.error("Member already added");
      return;
    }
    onChange([...value, trimmed]);
    setNewMemberInput("");
  };

  const handleToggleUser = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((h) => h !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  const filteredUsers =
    workspaceUsers?.filter((u: WorkspaceUser) => {
      const q = memberSearch.toLowerCase();
      return (
        u.realName.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.displayName && u.displayName.toLowerCase().includes(q))
      );
    }) ?? [];

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
            <div className="absolute z-10 w-full mt-1 bg-charcoal border border-border rounded-lg shadow-lg max-h-[320px] flex flex-col">
              <div className="p-2 border-b border-border">
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
              <div className="max-h-80 overflow-y-scroll divide-y divide-border scrollbar-thin">
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
                    const isSelected = value.includes(user.id);
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

      <div className="flex flex-wrap gap-2 mt-3">
        {value.map((handle) => {
          const user = workspaceUsers?.find(
            (u: WorkspaceUser) => u.id === handle
          );
          const label = user?.realName ?? user?.name ?? handle;
          return (
            <span
              key={handle}
              className="inline-flex items-center gap-1 bg-amber/10 text-amber-light border border-amber/20 px-3 py-1 rounded-full text-sm"
            >
              {label}
              <button
                type="button"
                onClick={() => handleRemoveMember(handle)}
                className="ml-1 text-amber-light hover:text-amber"
              >
                ×
              </button>
            </span>
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
