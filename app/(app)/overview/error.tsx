"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function OverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error("Overview page error:", error);
  }, [error]);

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Unable to load dashboard
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We encountered a problem while assembling your overview. This might be a temporary connection issue.
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 mt-4"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
