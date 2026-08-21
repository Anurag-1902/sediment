"use client";
import { useEffect, useState } from "react";

type PollState = "idle" | "syncing" | "sent" | "none";

export function CronPoller() {
  const [state, setState] = useState<PollState>("idle");

  const triggerSync = async () => {
    setState("syncing");
    try {
      const res = await fetch("/api/cron");
      const data = await res.json();
      setTimeout(() => {
        setState(data.sent > 0 ? "sent" : "none");
        setTimeout(() => setState("idle"), 3000);
      }, 2000);
    } catch {
      setState("idle");
    }
  };

  useEffect(() => {
    const poll = () => fetch("/api/cron").catch(() => {});
    poll();
    const interval = setInterval(poll, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dotColor = {
    idle: "bg-emerald-400",
    syncing: "bg-amber-400",
    sent: "bg-emerald-400",
    none: "bg-stone-400",
  }[state];

  const label = {
    idle: "Auto-sync active",
    syncing: "Syncing...",
    sent: "Standup sent!",
    none: "No standups due",
  }[state];

  const textColor = {
    idle: "text-emerald-400",
    syncing: "text-amber-400",
    sent: "text-emerald-400",
    none: "text-stone-400",
  }[state];

  return (
    <button
      onClick={triggerSync}
      title="Click to sync now, or leave open for auto-sync every 30 seconds"
      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className={`h-2 w-2 rounded-full ${dotColor} ${state === "idle" ? "animate-pulse" : ""}`} />
      <span className={`text-xs font-medium ${textColor}`}>{label}</span>
    </button>
  );
}
