"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AnimatedIcon } from "@/components/animated-icon";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";
import {
  Layers,
  Slack,
  ArrowRight,
  Clock,
  Search,
  BarChart3,
  MessageSquare,
  Shield,
  Sparkles,
  ChevronDown,
  MessageCircle,
  Database,
  Hash,
  ExternalLink,
  Key,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Hash,
    title: "Slack-Native Standups",
    description:
      "Automated daily prompts that meet devs where they work. No context switching, no extra apps.",
  },
  {
    icon: Clock,
    title: "Async by Default",
    description:
      "Team members respond on their own schedule. Perfect for distributed teams across timezones.",
  },
  {
    icon: Search,
    title: "Natural Language Queries",
    description:
      '"What did Sarah work on last week?" — Ask questions in plain English, get instant answers.',
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    description:
      "Business users get visibility without interrupting flow. See blockers, progress, and patterns.",
  },
  {
    icon: MessageSquare,
    title: "Context Accumulation",
    description:
      "Updates layer over time like sediment. AI builds a living memory of your project.",
  },
  {
    icon: Shield,
    title: "Privacy-First",
    description:
      "Your data stays yours. SOC 2 compliant with granular access controls.",
  },
];

function FeatureCard({ icon: Icon, title, description }: (typeof features)[0]) {
  return (
    <motion.div
      className="group rounded-xl border border-border-custom bg-surface p-6 transition-all hover:border-amber/30"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="mb-4 inline-flex rounded-lg bg-amber/10 p-3">
        <AnimatedIcon icon={Icon} className="h-5 w-5 text-amber" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
    </motion.div>
  );
}

export default function Home() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const pending = sessionStorage.getItem("pendingRedirect");
      if (pending) {
        sessionStorage.removeItem("pendingRedirect");
        router.push(pending);
      }
    }
  }, [session, router]);

  const connectHref = session
    ? "/dashboard/settings/slack"
    : "/sign-up?redirect=/dashboard/settings/slack";

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
      </div>

      {/* ==================== HERO ==================== */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left - Text */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-custom bg-surface px-4 py-1.5 text-sm text-text-muted">
              <Slack className="h-4 w-4 text-amber" />
              Native Slack Integration
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl text-balance">
              Standups that{" "}
              <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent">
                build context
              </span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-text-muted text-pretty">
              Sediment runs async standups in Slack, captures what your devs are
              working on, and lets anyone query team progress with natural
              language. Updates layer over time — building living project memory.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href={connectHref}>
                <Button
                  size="lg"
                  className="bg-amber font-semibold text-charcoal hover:bg-amber-light"
                >
                  <Slack className="mr-2 h-4 w-4" />
                  Connect Slack
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
              >
                See how it works
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <div className="border-t border-border-custom pt-6">
              <p className="mb-4 text-sm text-text-muted">
                Trusted by engineering teams at
              </p>
              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-text-muted/60">
                <span>Vercel</span>
                <span>Linear</span>
                <span>Raycast</span>
                <span>Resend</span>
              </div>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative">
            {/* Main card with gradient layers */}
            <div className="relative overflow-hidden rounded-2xl border border-border-custom bg-slate">
              <div className="relative h-[420px] lg:h-[480px] overflow-hidden rounded-2xl">
                <Image
                  src="/hero-sediment.jpg"
                  alt="Geological sediment layers"
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-charcoal/40 via-transparent to-transparent" />
              </div>

              {/* Floating card */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="rounded-xl border border-border-custom bg-surface-raised/90 p-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/10">
                      <Sparkles className="h-4 w-4 text-amber" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">
                        &quot;What&apos;s the team working on this sprint?&quot;
                      </p>
                      <p className="text-xs text-text-muted">
                        Query your team&apos;s context naturally
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl text-balance">
            Standups that actually work
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Capture context without the ceremony. Query progress without the
            meetings.
          </p>
        </div>

        <AnimatedSection className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <AnimatedItem key={f.title}>
              <FeatureCard {...f} />
            </AnimatedItem>
          ))}
        </AnimatedSection>

        {/* Showcase Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Seamless Team Sync */}
          <div className="group relative overflow-hidden rounded-xl border border-border-custom bg-slate">
            {/* Connected nodes visual */}
            <div className="relative h-[260px] overflow-hidden">
              <Image
                src="/feature-sync.jpg"
                alt="Connected team sync"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-semibold text-text">
                Seamless Team Sync
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Daily prompts that feel natural, responses that capture real
                context.
              </p>
            </div>
          </div>

          {/* Living Context */}
          <div className="group relative overflow-hidden rounded-xl border border-border-custom bg-slate">
            {/* 3D sediment layers visual */}
            <div className="relative h-[260px] overflow-hidden">
              <Image
                src="/feature-context.jpg"
                alt="Living context sediment layers"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-semibold text-text">Living Context</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Every update adds a layer. Query months of progress in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl text-balance">
            How Sediment works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Three simple steps to transform standups from ceremony into insight.
          </p>
        </div>

        <div className="space-y-24">
          {/* Step 01 */}
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-border-custom">01</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                  <AnimatedIcon icon={MessageCircle} className="h-5 w-5 text-amber" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text">Daily Slack Prompts</h3>
              <p className="leading-relaxed text-text-muted">
                Sediment sends a simple async prompt to each team member.
                &quot;What did you work on? Any blockers?&quot;
              </p>
            </div>
            <div className="rounded-xl border border-border-custom bg-surface p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-amber text-sm font-bold text-charcoal">
                  S
                </div>
                <div>
                  <p className="text-sm font-medium text-text">Sediment</p>
                  <p className="text-xs text-text-muted">9:00 AM</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-text-muted">
                Hey Sarah! Quick check-in — what are you working on today?
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <ChevronDown className="h-6 w-6 text-border-custom" />
          </div>

          {/* Step 02 */}
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl border border-border-custom bg-surface p-6">
                <pre className="overflow-x-auto font-mono text-sm text-text-muted">
                  <code>
                    <span className="text-amber">+</span> context.add({"\n"}
                    {"  "}user:{" "}
                    <span className="text-amber-light">&quot;sarah&quot;</span>,{"\n"}
                    {"  "}work:{" "}
                    <span className="text-amber-light">
                      &quot;auth flow refactor&quot;
                    </span>
                    ,{"\n"}
                    {"  "}blocker:{" "}
                    <span className="text-text-muted">null</span>,{"\n"}
                    {"  "}timestamp:{" "}
                    <span className="text-amber-light">&quot;2024-01-15&quot;</span>
                    {"\n"})
                  </code>
                </pre>
              </div>
            </div>
            <div className="order-1 space-y-4 lg:order-2">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-border-custom">02</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                  <AnimatedIcon icon={Database} className="h-5 w-5 text-amber" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text">
                Context Accumulates
              </h3>
              <p className="leading-relaxed text-text-muted">
                Responses are parsed, structured, and layered into your
                project&apos;s living memory. Blockers are flagged automatically.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <ChevronDown className="h-6 w-6 text-border-custom" />
          </div>

          {/* Step 03 */}
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-border-custom">03</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                  <AnimatedIcon icon={Search} className="h-5 w-5 text-amber" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text">Query Naturally</h3>
              <p className="leading-relaxed text-text-muted">
                PMs and stakeholders ask questions in plain English. Get instant,
                accurate answers from accumulated context.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border-custom bg-surface px-4 py-3">
                <Search className="h-4 w-4 text-amber" />
                <span className="text-sm text-text">
                  What&apos;s blocking the auth release?
                </span>
              </div>
              <div className="rounded-lg bg-surface-raised p-4">
                <p className="text-sm text-text-muted">
                  Marcus mentioned waiting on API docs from backend. Sarah&apos;s
                  refactor is ready for review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CONNECT IN 3 STEPS ==================== */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl text-balance">
            Connect in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Bring your own Slack app — full control, zero vendor lock-in.
          </p>
        </div>

        <AnimatedSection className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatedItem>
            <motion.div
              className="rounded-xl border border-border bg-surface p-6 transition hover:border-amber/30"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="mb-4 inline-flex rounded-lg bg-amber/10 p-3">
                <AnimatedIcon icon={ExternalLink} className="h-5 w-5 text-amber" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text">
                Create a Slack App
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Head to api.slack.com/apps, create a new app from our ready-made
                manifest. Takes 30 seconds.
              </p>
              <a
                href="https://api.slack.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm text-amber hover:underline"
              >
                Open Slack API
                <ArrowRight className="h-3 w-3" />
              </a>
            </motion.div>
          </AnimatedItem>

          <AnimatedItem>
            <motion.div
              className="rounded-xl border border-border bg-surface p-6 transition hover:border-amber/30"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="mb-4 inline-flex rounded-lg bg-amber/10 p-3">
                <AnimatedIcon icon={Key} className="h-5 w-5 text-amber" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text">
                Grab Your Credentials
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Copy your Client ID, Client Secret, Signing Secret, and Bot Token
                from the Slack dashboard. We encrypt everything.
              </p>
            </motion.div>
          </AnimatedItem>

          <AnimatedItem>
            <motion.div
              className="rounded-xl border border-border bg-surface p-6 transition hover:border-amber/30"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="mb-4 inline-flex rounded-lg bg-amber/10 p-3">
                <AnimatedIcon icon={Zap} className="h-5 w-5 text-amber" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text">
                Start Running Standups
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Paste your credentials, pick a channel, set a sync time. Your
                first standup posts automatically.
              </p>
            </motion.div>
          </AnimatedItem>
        </AnimatedSection>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/5 blur-3xl" />
        </div>
        <div className="relative rounded-2xl border border-border-custom bg-surface px-8 py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-amber-dark">
            <Layers className="h-8 w-8 text-charcoal" />
          </div>
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-text sm:text-4xl text-balance">
            Ready to build your team&apos;s{" "}
            <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent">
              living context?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
            Join hundreds of engineering teams using Sediment to run better
            standups and surface insights faster.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href={connectHref}>
              <Button
                size="lg"
                className="bg-amber font-semibold text-charcoal hover:bg-amber-light"
              >
                <Slack className="mr-2 h-4 w-4" />
                Get Started — It&apos;s Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/settings/slack">
              <Button
                variant="ghost"
                size="lg"
                className="text-text-muted hover:text-text"
              >
                View Setup Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-text-muted">
            No credit card required · 5-minute setup · Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
