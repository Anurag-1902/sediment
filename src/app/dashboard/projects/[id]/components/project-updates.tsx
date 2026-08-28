"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";

export function ProjectUpdates({ projectId }: { projectId: string }) {
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
