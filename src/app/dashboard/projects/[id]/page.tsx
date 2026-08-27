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
  Settings,
  Clock,
  Users,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  MessageSquare,
  MessageCircle,
  ListTodo,
  Trash2,
} from "lucide-react";
import { TeamMembersSelector } from "@/components/dashboard/team-members-selector";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: project, isLoading } = trpc.project.get.useQuery({ id: projectId });
  const { data: stats } = trpc.project.stats.useQuery({ id: projectId });
  const { data: analytics } = trpc.project.analytics.useQuery(
    { id: project?.id ?? "" },
    { enabled: !!project }
  );

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
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverview stats={stats} project={project} projectId={projectId} />
        </TabsContent>

        <TabsContent value="updates">
          <ProjectUpdates projectId={projectId} />
        </TabsContent>

        <TabsContent value="tasks">
          <ProjectTasks projectId={projectId} />
        </TabsContent>

        <TabsContent value="analytics">
          {analytics ? (
            analytics.totalTasks === 0 ? (
              <div className="rounded-xl border border-dashed border-border-custom bg-surface/50 py-16 px-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
                  <BarChart3 className="h-6 w-6 text-amber" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">
                  No analytics yet
                </h3>
                <p className="text-sm text-text-muted max-w-md mx-auto">
                  Analytics populate as standup responses come in. Once your team starts replying to standup prompts in Slack, you&apos;ll see velocity trends, blocker patterns, and per-member workload here.
                </p>
              </div>
            ) : (
            <div className="space-y-6">
              {/* Top-level stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardContent className="pt-6">
                    <p className="text-xs text-text-muted mb-1">Total Tasks</p>
                    <p className="text-2xl font-bold text-text">{analytics.totalTasks}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardContent className="pt-6">
                    <p className="text-xs text-text-muted mb-1">Blockers</p>
                    <p className="text-2xl font-bold text-red-400">{analytics.blockerCount}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardContent className="pt-6">
                    <p className="text-xs text-text-muted mb-1">Avg Response Rate</p>
                    <p className="text-2xl font-bold text-text">{analytics.avgResponseRate}%</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardContent className="pt-6">
                    <p className="text-xs text-text-muted mb-1">Avg Days to Close</p>
                    <p className="text-2xl font-bold text-text">
                      {analytics.avgDaysToClose !== null ? `${analytics.avgDaysToClose}d` : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardContent className="pt-6">
                    <p className="text-xs text-text-muted mb-1">Signed Up Users</p>
                    <p className="text-2xl font-bold text-text">{analytics.totalUsers}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Task status breakdown */}
              <Card className="rounded-xl border-border-custom bg-surface">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-text">Task Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 h-40">
                    {Object.entries(analytics.statusCounts).map(([status, count]) => {
                      const maxCount = Math.max(...Object.values(analytics.statusCounts), 1);
                      const height = `${(count / maxCount) * 100}%`;
                      const colors: Record<string, string> = {
                        OPEN: "bg-blue-400",
                        IN_PROGRESS: "bg-amber",
                        BLOCKED: "bg-red-400",
                        CLOSED: "bg-emerald-400",
                      };
                      return (
                        <div key={status} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full flex flex-col items-center justify-end h-28">
                            <span className="text-xs font-bold text-text mb-1">{count}</span>
                            <div
                              className={`w-full max-w-[48px] rounded-t-md ${colors[status] ?? "bg-text-muted"}`}
                              style={{ height: height || "2px", minHeight: "2px" }}
                            />
                          </div>
                          <span className="text-[10px] text-text-muted text-center">
                            {status.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly trend */}
              <Card className="rounded-xl border-border-custom bg-surface">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-text">Weekly Velocity (8 weeks)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-40">
                    {analytics.weeklyTrend.map((week) => {
                      const maxVal = Math.max(
                        ...analytics.weeklyTrend.map((w) => Math.max(w.created, w.closed)),
                        1
                      );
                      return (
                        <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end justify-center gap-0.5 h-28">
                            <div
                              className="w-2.5 bg-amber/70 rounded-t"
                              style={{
                                height: `${(week.created / maxVal) * 100}%`,
                                minHeight: week.created > 0 ? "4px" : "0px",
                              }}
                              title={`Created: ${week.created}`}
                            />
                            <div
                              className="w-2.5 bg-emerald-400/70 rounded-t"
                              style={{
                                height: `${(week.closed / maxVal) * 100}%`,
                                minHeight: week.closed > 0 ? "4px" : "0px",
                              }}
                              title={`Closed: ${week.closed}`}
                            />
                          </div>
                          <span className="text-[9px] text-text-muted">{week.week}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-amber/70" /> Created
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-emerald-400/70" /> Closed
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Per-member breakdown */}
              <Card className="rounded-xl border-border-custom bg-surface">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-text">Member Workload</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.memberBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.memberBreakdown.map((member) => {
                        const total = member.open + member.inProgress + member.blocked + member.closed;
                        return (
                          <div key={member.name} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-text">{member.name}</span>
                              <span className="text-xs text-text-muted">{total} tasks</span>
                            </div>
                            <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                              {member.closed > 0 && (
                                <div
                                  className="bg-emerald-400"
                                  style={{ width: `${(member.closed / Math.max(total, 1)) * 100}%` }}
                                  title={`Closed: ${member.closed}`}
                                />
                              )}
                              {member.inProgress > 0 && (
                                <div
                                  className="bg-amber"
                                  style={{ width: `${(member.inProgress / Math.max(total, 1)) * 100}%` }}
                                  title={`In Progress: ${member.inProgress}`}
                                />
                              )}
                              {member.blocked > 0 && (
                                <div
                                  className="bg-red-400"
                                  style={{ width: `${(member.blocked / Math.max(total, 1)) * 100}%` }}
                                  title={`Blocked: ${member.blocked}`}
                                />
                              )}
                              {member.open > 0 && (
                                <div
                                  className="bg-blue-400"
                                  style={{ width: `${(member.open / Math.max(total, 1)) * 100}%` }}
                                  title={`Open: ${member.open}`}
                                />
                              )}
                            </div>
                            <div className="flex gap-3 text-[10px] text-text-muted">
                              {member.closed > 0 && <span>{member.closed} closed</span>}
                              {member.inProgress > 0 && <span>{member.inProgress} in progress</span>}
                              {member.blocked > 0 && <span className="text-red-400">{member.blocked} blocked</span>}
                              {member.open > 0 && <span>{member.open} open</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">No member data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Syncs */}
              <Card className="rounded-xl border-border-custom bg-surface">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-text">Standup Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-text-muted mb-1">Total Syncs</p>
                      <p className="text-lg font-bold text-text">{analytics.totalSyncs}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Avg Response Rate</p>
                      <p className="text-lg font-bold text-text">{analytics.avgResponseRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Avg Days to Close</p>
                      <p className="text-lg font-bold text-text">
                        {analytics.avgDaysToClose !== null ? `${analytics.avgDaysToClose} days` : "No closed tasks yet"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )
          ) : (
            <Card className="rounded-xl border-border-custom bg-surface">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-text-muted">Loading analytics...</p>
              </CardContent>
            </Card>
          )}
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
  projectId,
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
  project: { syncTime: string; syncTimezone: string; slackChannelName: string; standupPrompt: string };
  projectId: string;
}) {
  const { data: updates } = trpc.update.listByProject.useQuery({ projectId });
  const recentUpdates = updates ?? [];
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

      <Card className="rounded-xl border-border-custom bg-surface">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-text-muted flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Current Standup Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text italic leading-relaxed">
            &ldquo;{project.standupPrompt}&rdquo;
          </p>
          <p className="text-xs text-text-muted mt-2">
            Edit in Settings tab
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUpdates.length === 0 ? (
            <p className="text-sm text-text-muted italic py-4 text-center">
              No standup responses yet. They&apos;ll appear here as your team replies in Slack.
            </p>
          ) : (
            <div className="space-y-3">
              {recentUpdates.slice(0, 5).map((u: {
                id: string;
                rawText: string;
                aiSummary: string | null;
                createdAt: Date;
                memberName: string | null;
              }) => (
                <div key={u.id} className="rounded-lg border border-border-custom bg-surface-raised/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text">
                      {u.memberName || "Team member"}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(u.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted line-clamp-2">{u.rawText}</p>
                </div>
              ))}
            </div>
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
      <div className="rounded-xl border border-dashed border-border-custom bg-surface/50 py-16 px-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
          <MessageCircle className="h-6 w-6 text-amber" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">
          No standup responses yet
        </h3>
        <p className="text-sm text-text-muted max-w-md mx-auto mb-4">
          Standup prompts are sent to your Slack channel at the scheduled sync time. Once team members reply in the thread, their updates will appear here.
        </p>
        <p className="text-xs text-text-muted/70">
          Make sure the bot is invited to the channel with <code className="text-amber bg-surface-raised px-1.5 py-0.5 rounded">/invite @Sediment</code>
        </p>
      </div>
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
        memberName: string | null;
        user: { name: string | null } | null;
      }) => (
        <Card key={u.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {u.memberName ? `${u.memberName} (${u.slackUserId})` : u.slackUserId}
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
  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => {
      utils.task.listByProject.invalidate({ projectId });
      toast.success("Task deleted");
      setConfirmDeleteTaskId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setConfirmDeleteTaskId(null);
    },
  });
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);

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

  if (!tasks || tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-custom bg-surface/50 py-16 px-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
          <ListTodo className="h-6 w-6 text-amber" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">
          No tasks tracked yet
        </h3>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          Tasks are automatically extracted from Slack standup responses. When someone posts an update like &quot;working on the auth flow&quot; or tags a teammate for a task, it&apos;ll show up here.
        </p>
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
                assigneeName: string | null;
                lastMentionedAt: Date | null;
              }) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {task.assignedTo?.name ?? task.assigneeName ?? "Unassigned"}
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
                    {task.status === "CLOSED" && (
                      <div className="pt-1 border-t border-border-custom">
                        {confirmDeleteTaskId === task.id ? (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] text-text-muted flex-1">Delete this task?</span>
                            <button
                              onClick={() => deleteTask.mutate({ id: task.id })}
                              disabled={deleteTask.isPending}
                              className="text-[11px] font-medium rounded px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {deleteTask.isPending ? "Deleting..." : "Yes, delete"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteTaskId(null)}
                              disabled={deleteTask.isPending}
                              className="text-[11px] font-medium rounded px-2 py-1 text-text-muted hover:text-text transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteTaskId(task.id)}
                            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-red-400 transition-colors pt-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete task
                          </button>
                        )}
                      </div>
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
      memberHandles,
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
                  value={memberHandles}
                  onChange={setMemberHandles}
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
