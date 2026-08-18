"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, LayoutDashboard, Settings, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      title: "Dashboard",
    },
    {
      href: "/dashboard/settings/slack",
      icon: MessageSquare,
      title: "Slack Integration",
    },
  ];

  return (
    <aside className="hidden lg:flex w-16 flex-col items-center border-r border-border-custom bg-slate py-4">
      <Link href="/dashboard" className="mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-amber-dark">
          <Layers className="h-4 w-4 text-charcoal" />
        </div>
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-amber/10 text-amber"
                  : "text-text-muted hover:bg-surface-raised hover:text-text"
              )}
              title={item.title}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-text-muted text-xs font-medium">
          {userName?.split(" ").map((n) => n[0]).join("") ?? "U"}
        </div>
      </div>
    </aside>
  );
}
