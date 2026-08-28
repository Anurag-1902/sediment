"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Clock, Users, AlertTriangle, MessageCircle } from "lucide-react";

interface ProjectOverviewProps {
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
}

export function ProjectOverview({ stats, project, projectId }: ProjectOverviewProps) {
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
