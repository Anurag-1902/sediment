"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
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
}

export function SlackSettingsPage({
  appUrl,
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
    onSuccess: (data) => {
      toast.success(`Connected to ${data.teamName || "Slack workspace"}`);
      utils.slackWorkspace.get.invalidate();
    },
    onError: (err) => {
      toast.error(`Connection failed: ${err.message}`);
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

  useEffect(() => {
    if (workspace) {
      setForm((f) => ({
        ...f,
        workspaceName: workspace.workspaceName || f.workspaceName,
        clientId: workspace.clientId || f.clientId,
      }));
    }
  }, [workspace]);

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
                      <p className="text-sm text-text-muted">
                        No Slack workspace connected. Connect your workspace to start using Sediment.
                      </p>
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
                  <Step number={1} title="Sign in to your Slack workspace">
                    <p className="text-sm text-text-muted">
                      Open your Slack workspace in a browser. Make sure you're signed in as a workspace admin or owner — you'll need admin permissions to install apps.
                    </p>
                    <a
                      href="https://slack.com/signin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber hover:underline font-medium text-sm"
                    >
                      Open Slack
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <p className="text-xs text-text-muted italic mt-1">
                      Not sure which workspace? Check with your team lead.
                    </p>
                  </Step>

                  <Step number={2} title="Open the Slack API Dashboard">
                    <p className="text-sm text-text-muted">
                      This is where you create and manage Slack apps. Click the link below to open it. You'll be asked to sign in with the same Slack account.
                    </p>
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber hover:underline font-medium text-sm"
                    >
                      Open Slack API Dashboard &rarr;
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Step>

                  <Step number={3} title="Create a new Slack App">
                    <p className="text-sm text-text-muted">
                      On the Slack API page, click the green 'Create New App' button. Select 'From a manifest' when asked. Then choose YOUR workspace from the dropdown list.
                    </p>
                    <p className="text-xs text-text-muted italic mt-1">
                      If you see multiple workspaces, pick the one where your team communicates.
                    </p>
                  </Step>

                  <Step number={4} title="Paste the Sediment manifest">
                    <p className="text-sm text-text-muted mb-2">
                      Copy the manifest below and paste it into the JSON editor on Slack's page. This tells Slack what permissions Sediment needs. Then click 'Next' and 'Create'.
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
                  </Step>

                  <Step number={5} title="Install the app to your workspace">
                    <p className="text-sm text-text-muted">
                      After creating the app, Slack will show a review page. Click 'Install to Workspace' (or 'Create and Install'). Slack will ask you to authorize — click 'Allow'. This installs the Sediment bot into your workspace.
                    </p>
                  </Step>

                  <Step number={6} title="Find your credentials">
                    <p className="text-sm text-text-muted">
                      After installing, you'll land on your app's settings page. You need 4 values from two different pages:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-charcoal border border-border rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber mb-2">
                          From Basic Information page
                        </h4>
                        <a
                          href="https://api.slack.com/apps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber hover:underline font-medium text-sm"
                        >
                          Open Slack API Dashboard
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-text-muted mb-3">
                          Click your app name, then Basic Information in the left sidebar
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-sm text-text-muted shrink-0">Client ID</span>
                            <span className="text-sm text-text">Shown near the top of the page</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-sm text-text-muted shrink-0">Client Secret</span>
                            <div>
                              <span className="text-sm text-text block">Click "Show" to reveal, then copy</span>
                              <span className="text-xs text-text-muted">Click 'Show' then copy</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-sm text-text-muted shrink-0">Signing Secret</span>
                            <div>
                              <span className="text-sm text-text block">Scroll down to "App Credentials", click "Show", copy</span>
                              <span className="text-xs text-text-muted">Click 'Show' then copy</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-charcoal border border-border rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber mb-2">
                          From OAuth & Permissions page
                        </h4>
                        <p className="text-xs text-text-muted mb-3">
                          In the left sidebar of your Slack app settings, click &ldquo;OAuth &amp; Permissions&rdquo;
                        </p>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-text font-medium block">Bot User OAuth Token</span>
                            <p className="text-xs text-text-muted mt-1">
                              At the top of the page, under &ldquo;OAuth Tokens for Your Workspace&rdquo;,
                              you&apos;ll see a token starting with <code className="text-amber">xoxb-</code>.
                              Click &ldquo;Copy&rdquo; to copy the full token. If you don&apos;t see it,
                              click &ldquo;Install to Workspace&rdquo; first (Step 5).
                            </p>
                          </div>
                        </div>
                        <a
                          href="https://api.slack.com/apps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber hover:underline font-medium text-sm mt-3"
                        >
                          Open Slack API Dashboard
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted italic mt-1">
                      Keep this tab open — you'll paste these values in the form below.
                    </p>
                  </Step>

                  <Step number={7} title="Paste credentials below">
                    <p className="text-sm text-text-muted">
                      Scroll down to the 'Workspace Credentials' form on this page. Paste each value into the matching field, then click Save. After saving, click 'Test Connection' to verify everything works.
                    </p>
                    <p className="text-xs text-text-muted italic mt-1">
                      Your credentials are encrypted before storage — we never store them in plain text.
                    </p>
                  </Step>

                  <Step number={8} title="Invite the bot to your channel">
                    <p className="text-sm text-text-muted">
                      Finally, go to Slack and open the channel where you want daily standups to appear. Type the command below and press Enter. This adds the Sediment bot to that channel so it can post messages.
                    </p>
                    <code className="inline-block rounded bg-charcoal border border-border px-2 py-1 text-xs text-text">
                      /invite @Sediment
                    </code>
                    <p className="text-xs text-text-muted italic mt-1">
                      You can invite the bot to multiple channels and use different ones for different projects.
                    </p>
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
                  placeholder="Enter your Client ID"
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
                placeholder={isConnected ? "••••••••  (saved, enter new to replace)" : ""}
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
                placeholder={isConnected ? "••••••••  (saved, enter new to replace)" : ""}
              />

              <SecretInput
                label="Bot Token"
                value={form.botToken}
                onChange={(v) => setForm((f) => ({ ...f, botToken: v }))}
                visible={showSecret.botToken}
                onToggle={() =>
                  setShowSecret((s) => ({ ...s, botToken: !s.botToken }))
                }
                placeholder={isConnected ? "••••••••  (saved, enter new to replace)" : "Enter your Bot Token (starts with xoxb-)"}
              />

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => {
                    if (!form.clientId.trim()) {
                      toast.error("Client ID is required");
                      return;
                    }
                    if (!form.workspaceName.trim()) {
                      toast.error("Workspace name is required");
                      return;
                    }
                    if (
                      !workspace &&
                      (!form.clientSecret ||
                        !form.signingSecret ||
                        !form.botToken)
                    ) {
                      toast.error(
                        "All credentials are required for initial setup"
                      );
                      return;
                    }
                    saveMutation.mutate(form);
                  }}
                  disabled={
                    saveMutation.isPending ||
                    !form.clientId.trim() ||
                    !form.workspaceName.trim()
                  }
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
