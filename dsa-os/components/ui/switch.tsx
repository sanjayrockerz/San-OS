"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchProps {
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  "aria-label"?: string;
}

export function Switch({ defaultChecked = false, onCheckedChange, ...props }: SwitchProps) {
  const [checked, setChecked] = React.useState(defaultChecked);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        setChecked((c) => !c);
        onCheckedChange?.(!checked);
      }}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:ring-focus",
        checked ? "bg-primary" : "bg-border-strong"
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block size-4 transform rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}
