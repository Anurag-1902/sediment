"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProjectListItem = RouterOutput["project"]["list"][number];
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  FolderPlus,
  FolderOpen,
  ListTodo,
  Users,
  Clock,
  Activity,
  ArrowRight,
  MoreVertical,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardPage() {
  const { session } = useAuth();
  const { data: projects, isLoading } = trpc.project.list.useQuery();
  const utils = trpc.useUtils();
  const user = session?.user;

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted");
      utils.project.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { data: archivedProjects } = trpc.project.listArchived.useQuery();

  const restoreProject = trpc.project.restore.useMutation({
    onSuccess: () => {
      toast.success("Project restored");
      utils.project.list.invalidate();
      utils.project.listArchived.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const permanentDeleteProject = trpc.project.permanentDelete.useMutation({
    onSuccess: () => {
      toast.success("Project permanently deleted");
      utils.project.listArchived.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpenId]);

  const totalProjects = projects?.length ?? 0;
  const totalOpenTasks =
    projects?.reduce((sum: number, p: ProjectListItem) => sum + p.tasks.length, 0) ?? 0;
  const totalMembers =
    projects?.reduce((sum: number, p: ProjectListItem) => sum + p._count.members, 0) ?? 0;
  const activeProjects =
    projects?.filter((p: ProjectListItem) => p.isActive).length ?? 0;

  return (
    <div className="flex min-h-screen bg-charcoal">
      <DashboardSidebar userName={user?.name} />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border-custom bg-slate/50 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-semibold text-text">Dashboard</h1>
            <p className="text-sm text-text-muted">Manage your projects</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/projects/new">
              <Button
                size="sm"
                className="bg-amber hover:bg-amber-light text-charcoal font-medium"
              >
                <Plus className="mr-1 h-4 w-4" />
                New Project
              </Button>
            </Link>
            <div className="hidden sm:block h-8 w-px bg-border-custom" />
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/10 text-amber text-xs font-medium">
                {user?.name?.split(" ").map((n) => n[0]).join("") ?? "U"}
              </div>
              <div>
                <p className="text-sm font-medium text-text">
                  {user?.name ?? "User"}
                </p>
                <p className="text-xs text-text-muted">Business</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-custom bg-surface/50 py-16 px-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
                <FolderPlus className="h-6 w-6 text-amber" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">
                No projects yet
              </h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto mb-6">
                Create your first project to start running async standups in Slack. Setup takes about 2 minutes.
              </p>
              <Link href="/dashboard/projects/new">
                <Button className="bg-amber text-charcoal hover:bg-amber-light font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium text-text-muted">
                      <FolderOpen className="h-4 w-4 text-amber" />
                      Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-text">
                      {totalProjects}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium text-text-muted">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-text">
                      {activeProjects}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium text-text-muted">
                      <ListTodo className="h-4 w-4 text-amber" />
                      Open Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-text">
                      {totalOpenTasks}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border-custom bg-surface">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium text-text-muted">
                      <Users className="h-4 w-4 text-text-muted" />
                      Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-text">
                      {totalMembers}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Projects Grid */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-text">
                  Your Projects
                </h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project: ProjectListItem) => (
                    <div key={project.id} className="group relative">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="block"
                      >
                        <Card className="h-full rounded-xl border-border-custom bg-surface transition-all hover:border-amber/30">
                          <CardHeader className="pb-2 pr-10">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-semibold text-text">
                                {project.name}
                              </CardTitle>
                              {project.isActive ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] px-1.5 py-0">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-stone-500/10 text-stone-400 border-0 text-[10px] px-1.5 py-0">
                                  Paused
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-text-muted line-clamp-2">
                              {project.description || "No description"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <ListTodo className="h-3.5 w-3.5" />
                                {project._count.tasks} tasks
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {project._count.members} members
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                              <Clock className="h-3.5 w-3.5" />
                              {project.syncSessions[0]
                                ? `Last sync ${new Date(
                                    project.syncSessions[0].createdAt
                                  ).toLocaleDateString()}`
                                : "No syncs yet"}
                            </div>
                            <div className="flex items-center text-xs font-medium text-amber group-hover:text-amber-light">
                              View details
                              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>

                      {/* Three-dot menu — sits outside the Link so clicks don't navigate */}
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === project.id ? null : project.id);
                          }}
                          className="rounded-lg p-1.5 text-text-muted hover:bg-surface-raised hover:text-text transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpenId === project.id && (
                          <div className="absolute right-0 mt-1 w-40 rounded-lg border border-border-custom bg-surface-raised shadow-lg py-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (confirm(`Delete "${project.name}"? This removes all updates, tasks, and history.`)) {
                                  deleteProject.mutate({ id: project.id });
                                }
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {archivedProjects && archivedProjects.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                    <Archive className="h-4 w-4 text-text-muted" />
                    Project History
                  </h2>
                  <div className="space-y-3">
                    {archivedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between rounded-xl border border-border-custom bg-surface/50 px-5 py-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-muted">
                            {project.name}
                          </p>
                          <p className="text-xs text-text-muted/60 mt-0.5">
                            {project._count.tasks} tasks · {project._count.members} members
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => restoreProject.mutate({ id: project.id })}
                            disabled={restoreProject.isPending}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber hover:bg-amber/10 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete "${project.name}"? This cannot be undone.`)) {
                                permanentDeleteProject.mutate({ id: project.id });
                              }
                            }}
                            disabled={permanentDeleteProject.isPending}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete Forever
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
