"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LayoutDashboard, MessageSquareText, KanbanSquare, BarChart3, Settings } from "lucide-react";

import { ProjectOverview } from "./components/project-overview";
import { ProjectUpdates } from "./components/project-updates";
import { ProjectTasks } from "./components/project-tasks";
import { ProjectSettings } from "./components/project-settings";
import { ProjectAnalytics } from "./components/project-analytics";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading } = trpc.project.get.useQuery({ id: projectId });
  const { data: stats } = trpc.project.stats.useQuery({ id: projectId });
  const { data: analytics } = trpc.project.analytics.useQuery(
    { id: projectId },
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
        <div className="text-center text-text-muted">
          Project not found or you don&apos;t have access.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-text-muted hover:text-text transition-colors mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

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

      <Tabs defaultValue="overview" className="space-y-6">
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
          <ProjectAnalytics analytics={analytics} />
        </TabsContent>

        <TabsContent value="settings">
          <ProjectSettings project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
