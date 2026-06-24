"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { captureException } from "@/lib/observability/logger";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { boundary: "app" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This page hit an unexpected error. Your data is safe — try
          reloading, and if it keeps happening, head back to Overview.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => reset()} size="sm">
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <a href="/overview">Back to Overview</a>
        </Button>
      </div>
    </div>
  );
}
