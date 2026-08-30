"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { TeamMembersSelector } from "@/components/dashboard/team-members-selector";

export function ProjectSettings({ project }: { project: any }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [context, setContext] = useState(project.contextPlainText ?? "");
  const [syncTime, setSyncTime] = useState(project.syncTime);
  const [timezone, setTimezone] = useState(project.syncTimezone);
  const [isActive, setIsActive] = useState(project.isActive);
  const [channelId, setChannelId] = useState(project.slackChannelId ?? "");
  const [channelName, setChannelName] = useState(project.slackChannelName ?? "");
  const [customChannel, setCustomChannel] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<{ handle: string; role: string }[]>(
    project.members?.map((m: any) => ({ handle: m.slackHandle || m.slackUserId, role: m.role })) ?? []
  );
  const [standupPrompt, setStandupPrompt] = useState(project.standupPrompt ?? "");

  const { data: channels, error: channelsError } = trpc.slack.channels.useQuery();

  const isSlackNotConnected =
    channelsError?.data?.code === "PRECONDITION_FAILED";

  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated");
      utils.project.get.invalidate({ id: project.id });
      utils.project.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject.mutate({
      id: project.id,
      name,
      description,
      contextPlainText: context,
      slackChannelId: channelId,
      slackChannelName: channelName,
      syncTime,
      syncTimezone: timezone,
      isActive,
      members: selectedMembers.map((m) => ({ handle: m.handle, role: m.role.trim() || "Member" })),
      standupPrompt: standupPrompt.trim() || undefined,
    });
  };

  const TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  function generateTimeOptions() {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const hh = h.toString().padStart(2, "0");
        const mm = m.toString().padStart(2, "0");
        options.push(`${hh}:${mm}`);
      }
    }
    return options;
  }

  return (
    <div className="max-w-xl space-y-6">
      {isSlackNotConnected ? (
        <Card>
          <CardContent className="p-6">
            <div className="rounded-xl border-2 border-amber p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
                  <MessageSquare className="h-6 w-6 text-amber" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">
                  Connect your Slack workspace
                </h3>
                <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">
                  To manage this project&apos;s channel settings, you need to
                  connect your Slack account first.
                </p>
              </div>
              <Link href="/dashboard/settings/slack">
                <Button className="bg-amber hover:bg-amber-light text-charcoal font-medium">
                  Connect Slack Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Edit Project</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-name">Name</Label>
                <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-desc">Description</Label>
                <Input id="s-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-context">Context</Label>
                <Textarea id="s-context" rows={5} value={context} onChange={(e) => setContext(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Slack Channel</Label>
                {!customChannel && channels ? (
                  <select
                    className="w-full rounded-md border border-border bg-charcoal px-3 py-2 text-sm text-text"
                    value={channelId}
                    onChange={(e) => {
                      const v = e.target.value;
                      const ch = channels.find((c: { id: string; name: string }) => c.id === v);
                      setChannelId(v);
                      setChannelName(ch?.name ?? v);
                    }}
                  >
                    <option value="" disabled>
                      Select channel
                    </option>
                    {channels.map((c: { id: string; name: string }) => (
                      <option key={c.id} value={c.id}>
                        #{c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      placeholder="Channel ID"
                    />
                    <Input
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="Channel name"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomChannel(!customChannel)}
                >
                  {customChannel ? "Select from list" : "Enter custom channel"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sync Time</Label>
                  <select
                    className="w-full rounded-md border border-border bg-charcoal px-3 py-2 text-sm text-text"
                    value={syncTime}
                    onChange={(e) => setSyncTime(e.target.value)}
                  >
                    {generateTimeOptions().map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <select
                    className="w-full rounded-md border border-border bg-charcoal px-3 py-2 text-sm text-text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <Label htmlFor="editStandupPrompt">Standup Prompt</Label>
                <p className="text-xs text-text-muted">
                  The daily question sent to your Slack channel. Changes apply from the next scheduled sync.
                </p>
                <textarea
                  id="editStandupPrompt"
                  value={standupPrompt}
                  onChange={(e) => setStandupPrompt(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-border-custom bg-charcoal px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-amber/50 resize-none"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Between 10 and 500 characters</span>
                  <span>{standupPrompt.length}/500</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="s-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border bg-charcoal text-amber focus:ring-amber"
                />
                <Label htmlFor="s-active" className="text-sm font-normal mb-0">
                  Active (enable daily syncs)
                </Label>
              </div>

              <div className="space-y-2">
                <TeamMembersSelector
                  value={selectedMembers}
                  onChange={setSelectedMembers}
                  hasSlackConnected={!isSlackNotConnected}
                />
              </div>

              <Button
                type="submit"
                className="bg-amber hover:bg-amber-light text-charcoal"
                disabled={updateProject.isPending}
              >
                {updateProject.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

function Label({ htmlFor, children, className }: { htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className ?? ""}`}>
      {children}
    </label>
  );
}
