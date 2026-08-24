"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedIcon } from "@/components/animated-icon";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";
import {
  Target,
  Sparkles,
  Users,
  Heart,
  ArrowRight,
  Layers,
} from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Async-First",
    description:
      "We believe the best work happens when people have control over their time. Async standups respect deep work and timezone differences.",
  },
  {
    icon: Sparkles,
    title: "Context Over Noise",
    description:
      "Updates should build understanding, not create more meetings. Every standup response adds to a shared, queryable memory.",
  },
  {
    icon: Users,
    title: "Built for Real Teams",
    description:
      "Not a feature factory — a tool shaped by engineers who actually run standups. We ship what we use ourselves.",
  },
  {
    icon: Heart,
    title: "Developer Experience",
    description:
      "Setup in minutes, not days. Bring your own Slack app. No vendor lock-in. Your data, your infrastructure, your control.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-custom bg-surface px-4 py-1.5 text-sm text-text-muted mb-8 animate-pulse">
            <Layers className="h-4 w-4 text-amber" />
            About Sediment
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl text-balance">
            Standups shouldn&apos;t feel like{" "}
            <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent">
              interruptions
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-muted">
            We built Sediment because we were tired of standups that disrupted
            flow without creating real understanding. Your team deserves better.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="relative mx-auto max-w-4xl px-6 py-16">
        <motion.div
          className="rounded-2xl border border-border-custom bg-surface px-8 py-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl font-bold text-text mb-4">The Problem</h2>
          <div className="space-y-4 text-text-muted leading-relaxed">
            <p>
              Traditional standups force everyone into a synchronous meeting at
              the same time. For distributed teams, that means someone is always
              joining at an awkward hour. For deep-work-focused engineers, it
              means context switching out of flow state.
            </p>
            <p>
              Worse, most standup notes disappear into the void. Two months later,
              when someone asks &quot;What did we decide about the auth
              refactor?&quot; — nobody knows. The context is lost.
            </p>
            <p>
              Sediment fixes both problems: async prompts that respect your
              team&apos;s time, and a living, queryable memory of everything your
              team has shared.
            </p>
          </div>
        </motion.div>
      </section>

      {/* What we believe */}
      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            What we believe
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
            The principles that guide every decision we make.
          </p>
        </div>

        <AnimatedSection className="grid gap-6 sm:grid-cols-2">
          {values.map((v) => (
            <AnimatedItem key={v.title}>
              <div className="rounded-xl border border-border-custom bg-surface p-6 transition-all hover:border-amber/30 h-full">
                <div className="mb-4 inline-flex rounded-lg bg-amber/10 p-3">
                  <AnimatedIcon icon={v.icon} className="h-5 w-5 text-amber" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text">{v.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {v.description}
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
            Ready to run standups that{" "}
            <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent">
              respect your time?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
            Join hundreds of engineering teams using Sediment to capture context
            and surface insights — without the meetings.
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
