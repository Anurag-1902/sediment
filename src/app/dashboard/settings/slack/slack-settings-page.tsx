"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
} from "lucide-react";

function getManifest(appUrl: string) {
  return JSON.stringify(
    {
      display_information: {
        name: "Sediment",
        description: "AI-Powered Standup Automation",
        background_color: "#D97706",
      },
      features: {
        bot_user: { display_name: "Sediment", always_online: true },
      },
      oauth_config: {
        redirect_urls: [`${appUrl}/api/slack/oauth/callback`],
        scopes: {
          bot: [
            "chat:write",
            "channels:read",
            "channels:history",
            "groups:read",
            "groups:history",
            "im:write",
            "users:read",
            "app_mentions:read",
          ],
        },
      },
      settings: {
        event_subscriptions: {
          request_url: `${appUrl}/api/slack/events`,
          bot_events: ["message.channels", "message.groups", "app_mention"],
        },
        org_deploy_enabled: false,
        socket_mode_enabled: false,
        token_rotation_enabled: false,
      },
    },
    null,
    2
  );
}

function maskBotUserId(id: string | null | undefined) {
  if (!id) return "U***";
  if (id.length <= 6) return id;
  return `${id.slice(0, 1)}***${id.slice(-3)}`;
}

interface SlackSettingsPageProps {
  appUrl: string;
  hasEnvFallback: boolean;
}

export function SlackSettingsPage({
  appUrl,
  hasEnvFallback,
}: SlackSettingsPageProps) {
  const { session } = useAuth();
  const user = session?.user;
  const utils = trpc.useUtils();

  const { data: workspace } = trpc.slackWorkspace.get.useQuery();
  const saveMutation = trpc.slackWorkspace.save.useMutation({
    onSuccess: () => {
      toast.success("Slack credentials saved");
      utils.slackWorkspace.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const testMutation = trpc.slackWorkspace.test.useMutation({
    onSuccess: () => {
      utils.slackWorkspace.get.invalidate();
    },
  });
  const deleteMutation = trpc.slackWorkspace.delete.useMutation({
    onSuccess: () => {
      toast.success("Disconnected from Slack workspace");
      utils.slackWorkspace.get.invalidate();
      setForm({
        workspaceName: "",
        clientId: "",
        clientSecret: "",
        signingSecret: "",
        botToken: "",
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    workspaceName: "",
    clientId: "",
    clientSecret: "",
    signingSecret: "",
    botToken: "",
  });

  const [showSecret, setShowSecret] = useState({
    clientSecret: false,
    signingSecret: false,
    botToken: false,
  });

  const [guideOpen, setGuideOpen] = useState(!workspace);

  const manifest = getManifest(appUrl);

  const isConnected = Boolean(workspace);

  return (
    <div className="flex min-h-screen bg-charcoal">
      <DashboardSidebar userName={user?.name} />

      <main className="flex-1 overflow-auto">
        <div className="border-b border-border-custom bg-slate/50 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-text">
                Slack Integration
              </h1>
              <p className="text-sm text-text-muted">
                Connect your own Slack workspace to Sediment
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Prominent Status Banner */}
          {isConnected ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
              Your Slack workspace <strong>{workspace?.workspaceName}</strong>{" "}
              is connected. You can now create projects and run standups.
            </div>
          ) : (
            <div className="rounded-lg bg-amber/10 border border-amber/20 px-4 py-3 text-sm text-amber">
              Connect your Slack workspace to start using Sediment. Follow the
              steps below.
            </div>
          )}

          {/* Status Card */}
          <Card className="rounded-xl border-border-custom bg-surface">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {isConnected ? (
                    <>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
                        Connected to {workspace?.workspaceName}
                      </Badge>
                      <p className="text-sm text-text-muted">
                        Bot user: {maskBotUserId(workspace?.botUserId)}
                      </p>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-amber/10 text-amber border-0">
                        Not connected
                      </Badge>
                      {hasEnvFallback ? (
                        <p className="text-sm text-text-muted">
                          Until connected, the app will use the default demo
                          workspace.
                        </p>
                      ) : (
                        <p className="text-sm text-text-muted">
                          No Slack workspace configured. The app will not work
                          until you connect your workspace.
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testMutation.mutate()}
                        disabled={testMutation.isPending}
                      >
                        {testMutation.isPending ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : null}
                        Test Connection
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : null}
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {testMutation.isSuccess && testMutation.data && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                    Connected to {testMutation.data.teamName} (bot{" "}
                    {testMutation.data.botUserId})
                  </div>
                  <Link href="/dashboard">
                    <Button
                      size="sm"
                      className="bg-amber hover:bg-amber-light text-charcoal"
                    >
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              )}

              {testMutation.isError && (
                <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
                  {testMutation.error?.message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guide */}
          <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
            <Card className="rounded-xl border-border-custom bg-surface">
              <CardHeader className="pb-2">
                <CollapsibleTrigger>
                <Button
                  variant="ghost"
                  className="flex w-full items-center justify-between text-left px-0 hover:bg-transparent cursor-pointer"
                >
                  <CardTitle className="text-base">
                    Connection Guide
                  </CardTitle>
                  <ChevronDown
                    className={`h-4 w-4 text-text-muted transition-transform ${
                      guideOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  <Step number={1} title="Create a Slack App">
                    <p className="text-sm text-text-muted">
                      Go to{" "}
                      <a
                        href="https://api.slack.com/apps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber hover:underline"
                      >
                        api.slack.com/apps
                      </a>{" "}
                      and click "Create New App" &rarr; "From a manifest".
                      Select your workspace.
                    </p>
                    <Placeholder>Screenshot: Create app button</Placeholder>
                  </Step>

                  <Step number={2} title="Paste this manifest">
                    <p className="text-sm text-text-muted mb-2">
                      Copy the manifest below and paste it into Slack. It
                      includes the correct request URLs for this deployment.
                    </p>
                    <div className="relative">
                      <pre className="rounded-lg bg-charcoal border border-border p-3 text-xs text-text-muted overflow-auto max-h-72">
                        <code>{manifest}</code>
                      </pre>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          navigator.clipboard.writeText(manifest);
                          toast.success("Manifest copied");
                        }}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                    <Placeholder>Screenshot: Manifest pasted</Placeholder>
                  </Step>

                  <Step number={3} title="Install the app to your workspace">
                    <p className="text-sm text-text-muted">
                      Click "Install to Workspace" and authorize. This grants
                      the bot access.
                    </p>
                    <Placeholder>Screenshot: Install button</Placeholder>
                  </Step>

                  <Step number={4} title="Copy your credentials">
                    <div className="text-sm text-text-muted space-y-1">
                      <p>
                        Under <strong>Basic Information</strong>, copy:
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        <li>Client ID</li>
                        <li>Client Secret (click Show)</li>
                        <li>Signing Secret (click Show)</li>
                      </ul>
                      <p>
                        Under <strong>OAuth & Permissions</strong>, copy:
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        <li>Bot User OAuth Token (starts with xoxb-)</li>
                      </ul>
                    </div>
                    <Placeholder>
                      Screenshot: Credentials location
                    </Placeholder>
                  </Step>

                  <Step number={5} title="Paste them below">
                    <p className="text-sm text-text-muted">
                      Fill in the form and click Save. Then click Test
                      Connection.
                    </p>
                  </Step>

                  <Step number={6} title="Invite the bot to your channel">
                    <p className="text-sm text-text-muted">
                      In Slack, go to the channel you want Sediment to post in
                      and type:
                    </p>
                    <code className="inline-block rounded bg-charcoal border border-border px-2 py-1 text-xs text-text">
                      /invite @Sediment
                    </code>
                  </Step>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Credentials Form */}
          <Card className="rounded-xl border-border-custom bg-surface">
            <CardHeader>
              <CardTitle className="text-base">Workspace Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Workspace name</Label>
                <Input
                  value={form.workspaceName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, workspaceName: e.target.value }))
                  }
                  placeholder="My Workspace"
                />
              </div>

              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientId: e.target.value }))
                  }
                  placeholder="11792487095461.xxx"
                />
              </div>

              <SecretInput
                label="Client Secret"
                value={form.clientSecret}
                onChange={(v) => setForm((f) => ({ ...f, clientSecret: v }))}
                visible={showSecret.clientSecret}
                onToggle={() =>
                  setShowSecret((s) => ({
                    ...s,
                    clientSecret: !s.clientSecret,
                  }))
                }
              />

              <SecretInput
                label="Signing Secret"
                value={form.signingSecret}
                onChange={(v) => setForm((f) => ({ ...f, signingSecret: v }))}
                visible={showSecret.signingSecret}
                onToggle={() =>
                  setShowSecret((s) => ({
                    ...s,
                    signingSecret: !s.signingSecret,
                  }))
                }
              />

              <SecretInput
                label="Bot Token"
                value={form.botToken}
                onChange={(v) => setForm((f) => ({ ...f, botToken: v }))}
                visible={showSecret.botToken}
                onToggle={() =>
                  setShowSecret((s) => ({ ...s, botToken: !s.botToken }))
                }
                placeholder="xoxb-..."
              />

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => saveMutation.mutate(form)}
                  disabled={saveMutation.isPending}
                  className="bg-amber hover:bg-amber-light text-charcoal"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : null}
                  Save
                </Button>
                {isConnected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending}
                  >
                    {testMutation.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : null}
                    Test Connection
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/10 text-amber text-xs font-bold">
        {number}
      </div>
      <div className="space-y-2 flex-1">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border-custom bg-charcoal/50 px-4 py-6 text-center text-xs text-text-muted">
      {children}
    </div>
  );
}

function SecretInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
