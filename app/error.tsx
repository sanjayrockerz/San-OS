"use client";

import { useEffect } from "react";

import { captureException } from "@/lib/observability/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-[#0d0d10] px-6 text-white">
        <div className="text-center">
          <h1 className="text-lg font-semibold">SanOS hit a snag</h1>
          <p className="mt-1 text-sm text-white/60">
            An unrecoverable error occurred while loading the app.
          </p>
          <button
            onClick={() => reset()}
            className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
