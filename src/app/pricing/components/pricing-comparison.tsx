"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingTierFeature {
  name: string;
  starter?: boolean | string;
  pro?: boolean | string;
  business?: boolean | string;
}

const PRICING_FEATURES: PricingTierFeature[] = [
  // Core Features
  { name: "Slack Integration", starter: true, pro: true, business: true },
  { name: "AI-Powered Standups", starter: true, pro: true, business: true },
  { name: "Task Tracking", starter: true, pro: true, business: true },
  { name: "Team Collaboration", starter: true, pro: true, business: true },

  // Projects & Teams
  { name: "Projects", starter: "1", pro: "Unlimited", business: "Unlimited" },
  { name: "Team Members", starter: "Up to 5", pro: "Unlimited", business: "Unlimited" },
  { name: "Projects per Member", starter: "1", pro: "Unlimited", business: "Unlimited" },

  // Analytics & Insights
  { name: "Analytics Dashboard", starter: true, pro: true, business: true },
  { name: "Velocity Tracking", starter: false, pro: true, business: true },
  { name: "Team Workload Insights", starter: false, pro: true, business: true },
  { name: "Response Rate Analytics", starter: false, pro: true, business: true },

  // Customization & Control
  { name: "Custom Standup Prompts", starter: false, pro: true, business: true },
  { name: "Standup Schedule Control", starter: false, pro: true, business: true },
  { name: "Role-Based Access Control", starter: false, pro: false, business: true },
  { name: "Multiple Slack Workspaces", starter: false, pro: false, business: true },

  // Support & SLA
  { name: "Email Support", starter: false, pro: true, business: true },
  { name: "Priority Support", starter: false, pro: false, business: true },
  { name: "Custom Onboarding", starter: false, pro: false, business: true },
  { name: "SLA Guarantee", starter: false, pro: false, business: true },

  // Export & Integrations
  { name: "Data Export", starter: false, pro: true, business: true },
  { name: "API Access", starter: false, pro: false, business: true },
  { name: "Webhooks", starter: false, pro: false, business: true },
];

export function PricingComparison({
  onSelectPlan,
  currentPlan,
}: {
  onSelectPlan: (plan: "STARTER" | "PRO" | "BUSINESS") => void;
  currentPlan?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Mobile Comparison (Stacked) */}
      <div className="md:hidden space-y-6">
        {["STARTER", "PRO", "BUSINESS"].map((planKey) => {
          const plans: Record<string, any> = {
            STARTER: {
              name: "Starter",
              price: "₹1",
              period: "/day",
              description: "24-hour access to test all features",
              cta: "Start Free Trial",
              highlighted: false,
            },
            PRO: {
              name: "Pro",
              price: "₹499",
              period: "/month",
              description: "For growing teams",
              cta: "Upgrade to Pro",
              highlighted: true,
            },
            BUSINESS: {
              name: "Business",
              price: "₹1,499",
              period: "/month",
              description: "For enterprises",
              cta: "Upgrade to Business",
              highlighted: false,
            },
          };

          const plan = plans[planKey];
          const isCurrent = currentPlan === planKey;

          return (
            <div
              key={planKey}
              className={`rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-amber bg-surface shadow-lg shadow-amber/5"
                  : "border-border-custom bg-surface"
              }`}
            >
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-text">{plan.name}</h3>
                <p className="text-text-muted text-sm mt-1">{plan.description}</p>
              </div>

              <div className="mb-6 pb-6 border-b border-border-custom">
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-text">{plan.price}</span>
                  <span className="text-text-muted">{plan.period}</span>
                </div>
                <Button
                  onClick={() => onSelectPlan(planKey as "STARTER" | "PRO" | "BUSINESS")}
                  disabled={isCurrent}
                  className={`w-full ${
                    isCurrent
                      ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                      : plan.highlighted
                        ? "bg-amber text-charcoal hover:bg-amber-light"
                        : ""
                  }`}
                >
                  {isCurrent ? "Current Plan" : plan.cta}
                </Button>
              </div>

              <div className="space-y-3">
                {PRICING_FEATURES.map((feature) => {
                  const featureValue = feature[planKey.toLowerCase() as "starter" | "pro" | "business"];
                  return (
                    <div key={feature.name} className="flex items-start gap-3">
                      {featureValue ? (
                        <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-text-muted flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={featureValue ? "text-text text-sm" : "text-text-muted text-sm"}>
                          {feature.name}
                        </p>
                        {typeof featureValue === "string" && featureValue !== "true" && (
                          <p className="text-amber text-xs font-semibold">{featureValue}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Comparison (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-custom">
              <th className="text-left py-4 px-4 font-semibold text-text w-64">Features</th>
              <th className="text-center py-4 px-4">
                <div>
                  <p className="font-bold text-lg text-text">Starter</p>
                  <p className="text-sm text-text-muted">₹1/day</p>
                </div>
              </th>
              <th className="text-center py-4 px-4 bg-surface">
                <div>
                  <p className="font-bold text-lg text-text">Pro</p>
                  <p className="text-sm text-text-muted">₹499/month</p>
                </div>
              </th>
              <th className="text-center py-4 px-4">
                <div>
                  <p className="font-bold text-lg text-text">Business</p>
                  <p className="text-sm text-text-muted">₹1,499/month</p>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {PRICING_FEATURES.map((feature, idx) => (
              <tr
                key={feature.name}
                className={`border-b border-border-custom ${idx % 2 === 0 ? "bg-transparent" : "bg-charcoal/30"}`}
              >
                <td className="py-4 px-4 font-medium text-text text-sm">{feature.name}</td>
                <td className="text-center py-4 px-4">
                  {feature.starter ? (
                    typeof feature.starter === "string" ? (
                      <span className="text-amber text-sm font-semibold">{feature.starter}</span>
                    ) : (
                      <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                    )
                  ) : (
                    <X className="h-5 w-5 text-text-muted/50 mx-auto" />
                  )}
                </td>
                <td className="text-center py-4 px-4 bg-surface">
                  {feature.pro ? (
                    typeof feature.pro === "string" ? (
                      <span className="text-amber text-sm font-semibold">{feature.pro}</span>
                    ) : (
                      <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                    )
                  ) : (
                    <X className="h-5 w-5 text-text-muted/50 mx-auto" />
                  )}
                </td>
                <td className="text-center py-4 px-4">
                  {feature.business ? (
                    typeof feature.business === "string" ? (
                      <span className="text-amber text-sm font-semibold">{feature.business}</span>
                    ) : (
                      <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                    )
                  ) : (
                    <X className="h-5 w-5 text-text-muted/50 mx-auto" />
                  )}
                </td>
              </tr>
            ))}

            {/* CTA Row */}
            <tr className="border-b border-border-custom">
              <td className="py-6 px-4"></td>
              <td className="text-center py-6 px-4">
                <Button
                  onClick={() => onSelectPlan("STARTER")}
                  disabled={currentPlan === "STARTER"}
                  variant="outline"
                  className="w-full"
                >
                  {currentPlan === "STARTER" ? "Current" : "Choose"}
                </Button>
              </td>
              <td className="text-center py-6 px-4 bg-surface">
                <Button
                  onClick={() => onSelectPlan("PRO")}
                  disabled={currentPlan === "PRO"}
                  className="w-full bg-amber text-charcoal hover:bg-amber-light"
                >
                  {currentPlan === "PRO" ? "Current" : "Upgrade"}
                </Button>
              </td>
              <td className="text-center py-6 px-4">
                <Button
                  onClick={() => onSelectPlan("BUSINESS")}
                  disabled={currentPlan === "BUSINESS"}
                  variant="outline"
                  className="w-full"
                >
                  {currentPlan === "BUSINESS" ? "Current" : "Upgrade"}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div className="mt-12 text-center">
        <p className="text-text-muted text-sm">
          All plans include 24/7 access to Slack integration and AI-powered standups.{" "}
          <a href="mailto:support@sediment.app" className="text-amber hover:underline">
            Contact us
          </a>{" "}
          for custom enterprise packages.
        </p>
      </div>
    </div>
  );
}
