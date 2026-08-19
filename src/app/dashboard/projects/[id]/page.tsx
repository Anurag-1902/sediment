"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { toast } from "sonner";
import {
  LayoutDashboard,
  MessageSquareText,
  KanbanSquare,
  Sparkles,
  Settings,
  Clock,
  Users,
  AlertTriangle,
  ArrowLeft,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: project, isLoading } = trpc.project.get.useQuery({ id: projectId });
  const { data: stats } = trpc.project.stats.useQuery({ id: projectId });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Project not found</EmptyTitle>
            <EmptyDescription>The project you are looking for does not exist.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.isActive ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-0">Active</Badge>
          ) : (
            <Badge className="bg-stone-500/10 text-stone-400 border-0">Paused</Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1">{project.description || "No description"}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 md:w-auto md:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden md:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="gap-2">
            <MessageSquareText className="h-4 w-4" />
            <span className="hidden md:inline">Updates</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <KanbanSquare className="h-4 w-4" />
            <span className="hidden md:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="ask-ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline">Ask AI</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverview stats={stats} project={project} />
        </TabsContent>

        <TabsContent value="updates">
          <ProjectUpdates projectId={projectId} />
        </TabsContent>

        <TabsContent value="tasks">
          <ProjectTasks projectId={projectId} />
        </TabsContent>

        <TabsContent value="ask-ai">
          <AskAI projectId={projectId} projectName={project.name} />
        </TabsContent>

        <TabsContent value="settings">
          <ProjectSettings project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectOverview({
  stats,
  project,
}: {
  stats:
    | {
        totalTasks: number;
        totalMembers: number;
        totalSyncs: number;
        blockerCount: number;
        inProgressCount: number;
        lastSync: { createdAt: Date; updates: Array<{ id: string }> } | null;
      }
    | undefined;
  project: { syncTime: string; syncTimezone: string; slackChannelName: string };
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalTasks ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber">{stats?.inProgressCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blockers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-400">{stats?.blockerCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalMembers ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Daily at {project.syncTime} ({project.syncTimezone})
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Slack channel: #{project.slackChannelName}
          </div>
          {stats?.lastSync ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Last sync: {new Date(stats.lastSync.createdAt).toLocaleString()} —{" "}
              {stats.lastSync.updates.length} updates
            </div>
          ) : (
            <div className="text-muted-foreground">No syncs yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectUpdates({ projectId }: { projectId: string }) {
  const { data: updates, isLoading } = trpc.update.listByProject.useQuery({ projectId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <Empty className="min-h-[300px]">
        <EmptyHeader>
          <EmptyTitle>No updates yet</EmptyTitle>
          <EmptyDescription>Updates will appear here once developers reply to sync threads in Slack.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((u: {
        id: string;
        rawText: string;
        aiSummary: string | null;
        createdAt: Date;
        slackUserId: string;
        user: { name: string | null } | null;
      }) => (
        <Card key={u.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {u.user?.name ?? u.slackUserId}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(u.createdAt).toLocaleString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {u.aiSummary && (
              <div className="rounded-lg bg-amber/5 border border-amber/10 p-3 text-sm text-amber-light">
                <span className="font-semibold">AI Summary:</span> {u.aiSummary}
              </div>
            )}
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Show original message
              </summary>
              <p className="mt-2 text-sm whitespace-pre-wrap">{u.rawText}</p>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProjectTasks({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading } = trpc.task.listByProject.useQuery({ projectId });
  const utils = trpc.useUtils();
  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      utils.task.listByProject.invalidate({ projectId });
      toast.success("Task updated");
    },
  });

  const columns: Array<{ key: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "CLOSED"; label: string; color: string }> = [
    { key: "OPEN", label: "Open", color: "bg-stone-500/5" },
    { key: "IN_PROGRESS", label: "In Progress", color: "bg-amber/5" },
    { key: "BLOCKED", label: "Blocked", color: "bg-rose-500/5" },
    { key: "CLOSED", label: "Closed", color: "bg-emerald-500/5" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{col.label}</h3>
            <Badge variant="outline">
              {tasks?.filter((t: { status: string }) => t.status === col.key).length ?? 0}
            </Badge>
          </div>
          <div className={`rounded-xl border border-border-custom p-3 space-y-2 min-h-[200px] ${col.color}`}>
            {tasks
              ?.filter((t: { status: string }) => t.status === col.key)
              .map((task: {
                id: string;
                description: string;
                status: string;
                assignedTo: { name: string | null } | null;
                lastMentionedAt: Date | null;
              }) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {task.assignedTo?.name ?? "Unassigned"}
                      </span>
                        <select
                          className="text-xs border border-border rounded px-2 py-1 bg-charcoal text-text"
                          value={task.status}
                        onChange={(e) =>
                          updateStatus.mutate({
                            id: task.id,
                            status: e.target.value as "OPEN" | "IN_PROGRESS" | "BLOCKED" | "CLOSED",
                          })
                        }
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                    {task.lastMentionedAt && (
                      <p className="text-[10px] text-muted-foreground">
                        Last mentioned: {new Date(task.lastMentionedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AskAI({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [question, setQuestion] = useState("");
  const { data: history } = trpc.ai.history.useQuery({ projectId });
  const askMutation = trpc.ai.ask.useMutation({
    onSuccess: () => {
      setQuestion("");
    },
  });

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askMutation.mutate({ projectId, question });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ask Sediment AI</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAsk} className="flex gap-3">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask about ${projectName}...`}
              disabled={askMutation.isPending}
            />
            <Button
              type="submit"
              disabled={askMutation.isPending || !question.trim()}
              className="bg-amber hover:bg-amber-light text-charcoal"
            >
              {askMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          {askMutation.data && (
            <div className="mt-4 rounded-lg bg-surface-raised p-4 text-sm whitespace-pre-wrap">
              {askMutation.data.answer}
            </div>
          )}
        </CardContent>
      </Card>

      {history && history.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Recent Questions</h3>
          {history.map((q: {
            id: string;
            question: string;
            answer: string;
            createdAt: Date;
            user: { name: string | null };
          }) => (
            <Card key={q.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{q.question}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectSettings({ project }: { project: any }) {
  const router = useRouter();
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
  const [memberHandles, setMemberHandles] = useState<string[]>(
    project.members?.map((m: any) => m.slackHandle || m.slackUserId) ?? []
  );
  const [newMemberInput, setNewMemberInput] = useState("");
  const [showAddById, setShowAddById] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: channels, error: channelsError } = trpc.slack.channels.useQuery();
  const { data: workspaceUsers, error: usersError } = trpc.slack.users.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );

  const isSlackNotConnected =
    channelsError?.data?.code === "PRECONDITION_FAILED" ||
    usersError?.data?.code === "PRECONDITION_FAILED";

  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated");
      utils.project.get.invalidate({ id: project.id });
      utils.project.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted");
      utils.project.list.invalidate();
      router.push("/dashboard");
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
      memberHandles,
    });
  };

  const handleAddMember = () => {
    const trimmed = newMemberInput.trim();
    if (!trimmed) return;
    if (memberHandles.includes(trimmed)) {
      toast.error("Member already added");
      return;
    }
    setMemberHandles((prev) => [...prev, trimmed]);
    setNewMemberInput("");
  };

  const handleRemoveMember = (handle: string) => {
    setMemberHandles((prev) => prev.filter((h) => h !== handle));
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
      for (let m = 0; m < 60; m += 15) {
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
        <Card>
          <CardHeader>
            <CardTitle>Edit Project</CardTitle>
          </CardHeader>
          <CardContent>
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
                <h3 className="text-sm font-medium">Team Members</h3>
                <p className="text-xs text-text-muted">
                  Only members listed here can post standup updates. Select workspace users from the dropdown below.
                </p>

                {isSlackNotConnected ? (
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
                      <Button size="sm" className="bg-amber hover:bg-amber-light text-charcoal font-medium">
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
                        {dropdownOpen ? "Close member list" : "Select workspace members..."}
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
                        <div className="max-h-64 overflow-y-auto scroll-smooth divide-y divide-border">
                          {!workspaceUsers ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="flex items-center gap-3 px-3 py-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-1 flex-1">
                                  <Skeleton className="h-3 w-24" />
                                  <Skeleton className="h-2 w-16" />
                                </div>
                              </div>
                            ))
                          ) : (
                            workspaceUsers
                              .filter((u: any) => {
                                const q = memberSearch.toLowerCase();
                                return (
                                  u.realName.toLowerCase().includes(q) ||
                                  u.name.toLowerCase().includes(q) ||
                                  (u.displayName && u.displayName.toLowerCase().includes(q))
                                );
                              })
                              .map((user: any) => {
                                const isSelected = memberHandles.includes(user.id);
                                return (
                                  <div
                                    key={user.id}
                                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-raised ${isSelected ? "bg-amber/5" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        setMemberHandles((prev) => prev.filter((h) => h !== user.id));
                                      } else {
                                        setMemberHandles((prev) => [...prev, user.id]);
                                      }
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
                                        {user.realName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
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
                  {memberHandles.map((handle) => {
                    const user = workspaceUsers?.find((u: any) => u.id === handle);
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddMember}
                      >
                        + Add
                      </Button>
                    </div>
                  )}
                </div>
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

      <Card className="border-rose-500/20">
        <CardHeader>
          <CardTitle className="text-rose-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting a project will remove all associated updates, tasks, and history.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this project?")) {
                deleteProject.mutate({ id: project.id });
              }
            }}
            disabled={deleteProject.isPending}
          >
            Delete Project
          </Button>
        </CardContent>
      </Card>
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
