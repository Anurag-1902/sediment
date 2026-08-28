"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2, ListTodo } from "lucide-react";

export function ProjectTasks({ projectId }: { projectId: string }) {
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
