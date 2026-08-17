"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
} from "lucide-react";

const features = [
  {
    icon: Slack,
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
    <div className="group rounded-xl border border-border-custom bg-surface p-6 transition-all hover:border-amber/30">
      <div className="mb-4 inline-flex rounded-lg bg-amber/10 p-3">
        <Icon className="h-5 w-5 text-amber" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}

export default function Home() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative container mx-auto px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
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
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-amber hover:bg-amber-light text-charcoal font-semibold gap-2"
                >
                  <Slack className="h-4 w-4" />
                  Add to Slack
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works" className="text-sm text-text-muted hover:text-text transition-colors flex items-center gap-1">
                See how it works
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="pt-4">
              <p className="text-sm text-text-muted mb-4">Trusted by engineering teams at</p>
              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-text-muted/60">
                <span>Vercel</span>
                <span>Linear</span>
                <span>Raycast</span>
                <span>Resend</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl border border-border-custom bg-surface overflow-hidden">
              <Image
                src="/hero.png"
                alt="Sediment layers visualization"
                width={600}
                height={500}
                className="w-full object-cover"
                priority
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-4 lg:-left-8 rounded-xl border border-border-custom bg-surface-raised/90 backdrop-blur p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/10">
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
      </section>

      {/* Features */}
      <section id="features" className="relative container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl text-balance">
            Standups that actually work
          </h2>
          <p className="mt-4 text-lg text-text-muted">
            Capture context without the ceremony. Query progress without the meetings.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

        {/* Showcase cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-xl border border-border-custom">
            <Image
              src="/feature-sync.png"
              alt="Seamless Team Sync"
              width={600}
              height={300}
              className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-semibold text-text">Seamless Team Sync</h3>
              <p className="mt-2 text-sm text-text-muted">
                Daily prompts that feel natural, responses that capture real context.
              </p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-border-custom">
            <Image
              src="/feature-context.png"
              alt="Living Context"
              width={600}
              height={300}
              className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-semibold text-text">Living Context</h3>
              <p className="mt-2 text-sm text-text-muted">
                Every update adds a layer. Query months of progress in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl text-balance">
            How Sediment works
          </h2>
          <p className="mt-4 text-lg text-text-muted">
            Three simple steps to transform standups from ceremony into insight.
          </p>
        </div>

        <div className="space-y-24">
          {/* Step 01 */}
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-border-custom">01</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                  <MessageCircle className="h-5 w-5 text-amber" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text">Daily Slack Prompts</h3>
              <p className="text-text-muted leading-relaxed">
                Sediment sends a simple async prompt to each team member. &quot;What did you
                work on? Any blockers?"
              </p>
            </div>
            <div className="rounded-xl border border-border-custom bg-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-amber text-charcoal text-sm font-bold">
                  S
                </div>
                <div>
                  <p className="text-sm font-medium text-text">Sediment</p>
                  <p className="text-xs text-text-muted">9:00 AM</p>
                </div>
              </div>
              <p className="text-sm text-text-muted">
                Hey Sarah! Quick check-in — what are you working on today?
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ChevronDown className="h-6 w-6 text-border-custom" />
          </div>

          {/* Step 02 */}
          <div className="grid gap-8 lg:grid-cols-2 items-center lg:flex-row-reverse">
            <div className="rounded-xl border border-border-custom bg-surface p-6 order-2 lg:order-1">
              <pre className="font-mono text-sm text-text-muted overflow-x-auto">
                <code>
                  <span className="text-amber">+</span> context.add({"\n"}
                  {"  "}user: <span className="text-amber-light">&quot;sarah&quot;</span>,{"\n"}
                  {"  "}work: <span className="text-amber-light">&quot;auth flow refactor&quot;</span>,{"\n"}
                  {"  "}blocker: <span className="text-text-muted">null</span>,{"\n"}
                  {"  "}timestamp: <span className="text-amber-light">&quot;2024-01-15&quot;</span>{"\n"}
                  )
                </code>
              </pre>
            </div>
            <div className="space-y-4 order-1 lg:order-2">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-border-custom">02</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                  <Database className="h-5 w-5 text-amber" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text">Context Accumulates</h3>
              <p className="text-text-muted leading-relaxed">
                Responses are parsed, structured, and layered into your project&apos;s
                living memory. Blockers are flagged automatically.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ChevronDown className="h-6 w-6 text-border-custom" />
          </div>

          {/* Step 03 */}
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-border-custom">03</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                  <Search className="h-5 w-5 text-amber" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text">Query Naturally</h3>
              <p className="text-text-muted leading-relaxed">
                PMs and stakeholders ask questions in plain English. Get instant,
                accurate answers from accumulated context.
              </p>
            </div>
            <div className="rounded-xl border border-border-custom bg-surface p-6 space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border-custom bg-charcoal px-4 py-3">
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

      {/* CTA */}
      <section className="relative container mx-auto px-6 py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/5 blur-3xl" />
        </div>
        <div className="relative rounded-2xl border border-border-custom bg-surface px-8 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-amber-dark mb-8">
            <Layers className="h-8 w-8 text-charcoal" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl text-balance">
            Ready to build your team&apos;s{" "}
            <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent">
              living context?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
            Join hundreds of engineering teams using Sediment to run better standups
            and surface insights faster.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-amber hover:bg-amber-light text-charcoal font-semibold gap-2"
              >
                <Slack className="h-4 w-4" />
                Add to Slack — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              className="text-text-muted hover:text-text"
            >
              Schedule a Demo
            </Button>
          </div>
          <p className="mt-4 text-sm text-text-muted">
            No credit card required · 5-minute setup · Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
