"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Users,
  History,
  BarChart3,
  Settings,
  Bell,
  Sparkles,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserCircle,
  ChevronRight,
  Zap,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

const sidebarItems = [
  { icon: Users, label: "Team", href: "/dashboard", active: true },
  { icon: History, label: "History", href: "#" },
  { icon: BarChart3, label: "Insights", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

const teamMembers = [
  {
    name: "Sarah Chen",
    role: "Frontend",
    avatar: "SC",
    status: "completed",
    work: "Auth flow refactor - PR ready for review",
  },
  {
    name: "Marcus Johnson",
    role: "Backend",
    avatar: "MJ",
    status: "blocked",
    work: "API documentation for auth endpoints",
    blocker: "Waiting on security review",
  },
  {
    name: "Emily Park",
    role: "Full-stack",
    avatar: "EP",
    status: "completed",
    work: "Dashboard analytics integration",
  },
  {
    name: "James Wilson",
    role: "DevOps",
    avatar: "JW",
    status: "pending",
    work: "",
  },
  {
    name: "Aisha Patel",
    role: "Frontend",
    avatar: "AP",
    status: "completed",
    work: "Component library updates",
  },
];

const insights = [
  {
    type: "blocker",
    message: "Marcus has been blocked for 2 days on security review",
    priority: "high",
  },
  {
    type: "progress",
    message: "4 of 5 team members have completed standups today",
    priority: "info",
  },
  {
    type: "trend",
    message: "Auth feature is 80% complete based on recent updates",
    priority: "success",
  },
];

const recentQueries = [
  "What's blocking the auth release?",
  "Summarize Sarah's work this week",
  "Which tasks are at risk?",
];

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Completed", icon: CheckCircle2 },
    blocked: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Blocked", icon: AlertTriangle },
    pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending", icon: Clock },
  };
  const config = configs[status] ?? configs.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${config.bg} px-2.5 py-0.5 text-xs font-medium ${config.text}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export default function DashboardPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const user = session?.user;

  return (
    <div className="flex min-h-screen bg-charcoal">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-16 flex-col items-center border-r border-border-custom bg-slate py-4">
        <Link href="/" className="mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-amber-dark">
            <Layers className="h-4 w-4 text-charcoal" />
          </div>
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                item.active
                  ? "bg-amber/10 text-amber"
                  : "text-text-muted hover:bg-surface-raised hover:text-text"
              }`}
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-text-muted">
            <UserCircle className="h-4 w-4" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border-custom bg-slate/50 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-semibold text-text">Team Standups</h1>
            <p className="text-sm text-text-muted">Today, Jan 15</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-text-muted hover:bg-surface-raised hover:text-text transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber" />
            </button>
            <div className="h-8 w-px bg-border-custom" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center text-amber text-xs font-medium">
                {user?.name?.split(" ").map((n) => n[0]).join("") ?? "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-text">{user?.name ?? "User"}</p>
                <p className="text-xs text-text-muted">Business</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* AI Query Bar */}
          <div className="rounded-xl border border-border-custom bg-surface p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your team's progress..."
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
              />
              <Button size="sm" className="bg-amber hover:bg-amber-light text-charcoal font-medium shrink-0">
                Ask
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border-custom bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-text-muted">Completed</span>
              </div>
              <p className="text-2xl font-bold text-text">4</p>
              <p className="text-xs text-text-muted mt-1">of 5 members</p>
            </div>
            <div className="rounded-xl border border-border-custom bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span className="text-xs text-text-muted">Blocked</span>
              </div>
              <p className="text-2xl font-bold text-text">1</p>
              <p className="text-xs text-text-muted mt-1">needs attention</p>
            </div>
            <div className="rounded-xl border border-border-custom bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber" />
                <span className="text-xs text-text-muted">Pending</span>
              </div>
              <p className="text-2xl font-bold text-text">1</p>
              <p className="text-xs text-text-muted mt-1">awaiting response</p>
            </div>
            <div className="rounded-xl border border-border-custom bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-text-muted">Team Size</span>
              </div>
              <p className="text-2xl font-bold text-text">5</p>
              <p className="text-xs text-text-muted mt-1">active members</p>
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Team List - 2/3 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">Today&apos;s Updates</h2>
                <Button variant="ghost" size="sm" className="text-text-muted hover:text-text">
                  View All
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.name}
                    className="rounded-xl border border-border-custom bg-surface p-4 transition-all hover:border-amber/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/10 text-amber text-sm font-medium">
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-medium text-text">{member.name}</h3>
                          <span className="text-xs text-text-muted">{member.role}</span>
                          <StatusBadge status={member.status} />
                        </div>
                        {member.work && (
                          <p className="mt-1 text-sm text-text-muted">{member.work}</p>
                        )}
                        {member.blocker && (
                          <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-500/5 px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            <p className="text-xs text-rose-300">{member.blocker}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - 1/3 */}
            <div className="space-y-6">
              {/* AI Insights */}
              <div className="rounded-xl border border-border-custom bg-surface p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-amber" />
                  <h3 className="text-sm font-semibold text-text">AI Insights</h3>
                </div>
                <div className="space-y-3">
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 ${
                        insight.priority === "high"
                          ? "bg-rose-500/5 border border-rose-500/10"
                          : insight.priority === "success"
                            ? "bg-emerald-500/5 border border-emerald-500/10"
                            : "bg-amber/5 border border-amber/10"
                      }`}
                    >
                      <p className="text-xs text-text-muted leading-relaxed">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Queries */}
              <div className="rounded-xl border border-border-custom bg-surface p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-amber" />
                  <h3 className="text-sm font-semibold text-text">Recent Queries</h3>
                </div>
                <div className="space-y-2">
                  {recentQueries.map((q, i) => (
                    <button
                      key={i}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-raised hover:text-text transition-colors"
                    >
                      <Search className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{q}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trend */}
              <div className="rounded-xl border border-border-custom bg-surface p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-text">Sprint Velocity</h3>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {[40, 55, 45, 70, 60, 80, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-amber/20 hover:bg-amber/40 transition-colors"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d} className="text-[10px] text-text-muted">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
