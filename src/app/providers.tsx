"use client";

import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Toaster />
        <Navbar />
        {children}
      </TooltipProvider>
    </QueryProvider>
  );
}
