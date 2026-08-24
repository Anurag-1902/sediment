"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedIcon } from "@/components/animated-icon";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";
import {
  Hash,
  Clock,
  Search,
  BarChart3,
  MessageSquare,
  Shield,
  Brain,
  Bell,
  GitBranch,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const coreFeatures = [
  {
    icon: Hash,
    title: "Slack-Native Standups",
    description:
      "Meet your team where they already work. No new apps, no context switching. Sediment posts daily prompts directly in Slack channels and threads responses naturally into the conversation.",
  },
  {
    icon: Clock,
    title: "Fully Async",
    description:
      "Distributed teams respond on their own schedule across timezones. No more 9 AM standups that interrupt deep work. Updates roll in throughout the day and are synthesized automatically.",
  },
  {
    title: "Natural Language Queries",
    icon: Search,
    description:
      'Ask questions in plain English and get instant, accurate answers. "What did Sarah work on last week?" or "What\'s blocking the auth release?" — the context is always at your fingertips.',
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    description:
      "Business users and PMs get visibility without interrupting flow. See blockers, sprint velocity, and progress patterns at a glance — everything derived from actual dev updates, not guesswork.",
  },
  {
    icon: MessageSquare,
    title: "Context Accumulation",
    description:
      "Every update adds a layer like geological sediment. Over time, AI builds a living memory of your project — who worked on what, when decisions were made, and how blockers were resolved.",
  },
  {
    icon: Shield,
    title: "Privacy-First Architecture",
    description:
      "Your data stays yours. SOC 2 compliant with end-to-end encryption, granular access controls, and the ability to self-host. We never train on your data.",
  },
];

const moreFeatures = [
  {
    icon: Brain,
    title: "AI Summaries",
    description: "Daily and weekly summaries generated from standup responses.",
  },
  {
    icon: Bell,
    title: "Blocker Alerts",
    description: "Automatic flagging when team members mention blockers.",
  },
  {
    icon: GitBranch,
    title: "Multi-Project",
    description: "Run standups for multiple projects from a single workspace.",
  },
  {
    icon: Sparkles,
    title: "Smart Follow-ups",
    description: "AI suggests follow-up questions based on past updates.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
        <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl text-balance">
            Everything you need for{" "}
            <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent">
              better standups
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-muted">
            From daily prompts to natural language queries — Sediment gives your
            team the tools to capture context, surface insights, and move faster.
          </p>
        </div>
      </section>

      {/* Core Features — alternating layout */}
      <section className="relative mx-auto max-w-6xl px-6 py-16 space-y-24">
        {coreFeatures.map((feature, i) => {
          const isOdd = i % 2 === 1;
          return (
            <div
              key={feature.title}
              className={`grid items-center gap-12 lg:grid-cols-2 ${isOdd ? "" : ""}`}
            >
              <motion.div
                className={`space-y-4 ${isOdd ? "lg:order-2" : ""}`}
                initial={{ opacity: 0, x: isOdd ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                    <AnimatedIcon icon={feature.icon} className="h-5 w-5 text-amber" />
                  </div>
                  <h3 className="text-2xl font-bold text-text">{feature.title}</h3>
                </div>
                <p className="leading-relaxed text-text-muted text-pretty">
                  {feature.description}
                </p>
              </motion.div>
              <motion.div
                className={`rounded-xl border border-border-custom bg-surface p-8 ${isOdd ? "lg:order-1" : ""}`}
                initial={{ opacity: 0, x: isOdd ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="flex h-32 items-center justify-center rounded-lg bg-amber/5">
                  <AnimatedIcon icon={feature.icon} className="h-12 w-12 text-amber/40" />
                </div>
              </motion.div>
            </div>
          );
        })}
      </section>

      {/* And more */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            And more
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
            Features that make Sediment feel like magic.
          </p>
        </div>

        <AnimatedSection className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {moreFeatures.map((f) => (
            <AnimatedItem key={f.title}>
              <div className="rounded-xl border border-border-custom bg-surface p-6 transition-all hover:border-amber/30 h-full">
                <div className="mb-4 inline-flex rounded-lg bg-amber/10 p-3">
                  <AnimatedIcon icon={f.icon} className="h-5 w-5 text-amber" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text">{f.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {f.description}
                </p>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/5 blur-3xl" />
        </div>
        <div className="relative rounded-2xl border border-border-custom bg-surface px-8 py-16 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-text sm:text-4xl text-balance">
            Ready to transform your{" "}
            <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent">
              standups?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
            Join hundreds of engineering teams using Sediment to run better
            standups and surface insights faster.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-amber font-semibold text-charcoal hover:bg-amber-light"
              >
                Get Started Free
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
