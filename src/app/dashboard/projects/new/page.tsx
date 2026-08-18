"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X, Plus, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";

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
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
}

export default function NewProjectPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [syncTime, setSyncTime] = useState("09:00");
  const [timezone, setTimezone] = useState("America/New_York");
  const [handles, setHandles] = useState<string[]>([]);
  const [newHandle, setNewHandle] = useState("");
  const [customChannel, setCustomChannel] = useState(false);

  const { data: channels, error: channelsError } = trpc.slack.channels.useQuery();
  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      toast.success("Project created successfully");
      utils.project.list.invalidate();
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const isSlackNotConnected =
    channelsError?.data?.code === "PRECONDITION_FAILED";

  const handleAddHandle = () => {
    const clean = newHandle.trim();
    if (clean && !handles.includes(clean)) {
      setHandles([...handles, clean]);
      setNewHandle("");
    }
  };

  const handleRemoveHandle = (h: string) => {
    setHandles(handles.filter((x) => x !== h));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate({
      name,
      description,
      contextPlainText: context,
      slackChannelId: channelId,
      slackChannelName: channelName,
      syncTime,
      syncTimezone: timezone,
      memberHandles: handles,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Project</CardTitle>
        </CardHeader>
        <CardContent>
          {isSlackNotConnected ? (
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
                  To create a project, you need to connect your Slack account
                  first. This lets Sediment post standup prompts in your
                  channels.
                </p>
              </div>
              <Link href="/dashboard/settings/slack">
                <Button className="bg-amber hover:bg-amber-light text-charcoal font-medium">
                  Connect Slack Account
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Frontend Rewrite Q3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">Project Context</Label>
                <Textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={6}
                  placeholder="Project goals, tech stack, current milestones..."
                />
                <p className="text-xs text-text-muted">
                  This context helps AI understand and summarize updates.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Slack Channel</Label>
                {!customChannel && channels ? (
                  <Select
                    value={channelId}
                    onValueChange={(v: string | null) => {
                      if (v === null) return;
                      const ch = channels.find((c: { id: string; name: string }) => c.id === v);
                      setChannelId(v as string);
                      setChannelName((ch?.name ?? v) as string);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map((c: { id: string; name: string }) => (
                        <SelectItem key={c.id} value={c.id}>
                          #{c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select value={syncTime} onValueChange={(v: string | null) => v && setSyncTime(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions().map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={(v: string | null) => v && setTimezone(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Team Members (Slack handles)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    placeholder="@dev1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddHandle();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddHandle}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {handles.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-3 py-1 text-sm text-text"
                    >
                      {h}
                      <button
                        type="button"
                        onClick={() => handleRemoveHandle(h)}
                        className="text-text-muted hover:text-text"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber hover:bg-amber-light text-charcoal font-medium"
                disabled={createProject.isPending}
              >
                {createProject.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
