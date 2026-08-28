"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface AnalyticsData {
  totalTasks: number;
  blockerCount: number;
  avgResponseRate: number;
  avgDaysToClose: number | null;
  totalUsers: number;
  statusCounts: Record<string, number>;
  weeklyTrend: Array<{ week: string; created: number; closed: number }>;
  memberBreakdown: Array<{ name: string; open: number; inProgress: number; blocked: number; closed: number }>;
  totalSyncs: number;
}

export function ProjectAnalytics({ analytics }: { analytics: AnalyticsData | undefined }) {
  if (!analytics) {
    return (
      <Card className="rounded-xl border-border-custom bg-surface">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-text-muted">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (analytics.totalTasks === 0) {
    return (
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
    );
  }

  return (
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
  );
}
