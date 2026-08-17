import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-border bg-charcoal px-2.5 py-2 text-base text-text transition-colors outline-none placeholder:text-text-muted focus-visible:border-amber focus-visible:ring-1 focus-visible:ring-amber/50 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
