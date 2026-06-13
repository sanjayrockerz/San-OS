"use client";

import { Check } from "lucide-react";

interface CheckboxFieldProps {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}

/**
 * A labelled checkbox row built on a native checkbox (so it posts naturally in
 * a server-action form as `"on"` when ticked). The native input is visually
 * hidden behind a styled box via `peer`. Used for the cognitive pipeline.
 */
export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: CheckboxFieldProps) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-border-strong">
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer absolute inset-0 size-5 cursor-pointer appearance-none rounded-[6px] border border-input bg-background transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <Check className="pointer-events-none relative size-3.5 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight text-foreground">
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
