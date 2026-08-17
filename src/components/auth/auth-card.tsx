import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  icon: ReactNode;
  currentStep?: number;
  steps?: string[];
  backHref?: string;
  backLabel?: string;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
  icon,
  currentStep,
  steps,
  backHref,
  backLabel = "Back",
}: AuthCardProps) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-[440px]">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-3 -ml-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        ) : null}
        <Card className="rounded-2xl border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="gap-4 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl border bg-muted text-foreground">
                {icon}
              </div>
              {steps && typeof currentStep === "number" ? (
                <div className="flex items-center gap-1.5 pt-1">
                  {steps.map((step, index) => {
                    const isDone = index + 1 < currentStep;
                    const isActive = index + 1 === currentStep;

                    return (
                      <div
                        key={step}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                          isActive
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                        <span className="hidden sm:inline">{step}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-normal">
                {title}
              </CardTitle>
              <CardDescription className="leading-6">
                {description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">{children}</CardContent>
          {footer ? (
            <CardFooter className="flex-col gap-3 border-t bg-muted/35">
              {footer}
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
