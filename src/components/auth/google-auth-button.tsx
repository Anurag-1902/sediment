import { cn } from "@/lib/utils";

type GoogleAuthButtonProps = {
  className?: string;
};

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.43Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.81-1.75-5.6-4.12H3.06v2.58A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.91A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.3.32-1.91V7.51H3.06A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.06 4.49l3.34-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.98 14.69 2 12 2a9.99 9.99 0 0 0-8.94 5.51L6.4 10.09c.79-2.37 3-4.12 5.6-4.12Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({ className }: GoogleAuthButtonProps) {
  return (
    <a
      href="/api/auth/google/start"
      className={cn(
        "grid h-11 w-full grid-cols-[1.25rem_1fr_1.25rem] items-center gap-3 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-foreground/25 hover:bg-muted/45 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <GoogleMark />
      <span className="justify-self-center">Continue with Google</span>
      <span aria-hidden="true" />
    </a>
  );
}
