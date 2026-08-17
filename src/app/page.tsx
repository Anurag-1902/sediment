"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Layers, MessageSquare, Brain, Clock } from "lucide-react";

export default function Home() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium">
            <Layers className="mr-2 h-4 w-4 text-indigo-600" />
            AI-Powered Standup Automation
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Automate standups.
            <br />
            <span className="text-indigo-600">Track what matters.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Sediment layers developer updates into deep project understanding.
            Automated Slack syncs, AI summaries, and a unified dashboard for
            business users.
          </p>
          <div className="flex items-center justify-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                    Get Started
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-3">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Slack Integration</h3>
              <p className="text-muted-foreground">
                Post daily sync prompts automatically. Collect threaded replies
                and track progress without leaving Slack.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-lg bg-emerald-50 p-3">
                <Brain className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">AI Summaries</h3>
              <p className="text-muted-foreground">
                Gemini extracts tasks, summaries, and blockers from raw Slack
                messages. Your project context stays alive automatically.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-lg bg-amber-50 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Smart Follow-ups</h3>
              <p className="text-muted-foreground">
                After updates close, Sediment pings developers about open or
                in-progress tasks they may have forgotten to mention.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
