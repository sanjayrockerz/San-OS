"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Show close button */
  showClose?: boolean;
  /** Use bottom sheet style on mobile (default: true) */
  bottomSheet?: boolean;
}

/**
 * Adaptive dialog — renders as a centered modal on desktop (lg+),
 * as a bottom sheet on mobile. Drop-in replacement for generic modals.
 */
export function MobileDialog({
  open,
  onClose,
  title,
  children,
  className,
  showClose = true,
  bottomSheet = true,
}: MobileDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!bottomSheet) {
    // Standard centered dialog (e.g. for desktop)
    return (
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "relative z-10 w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border",
                className,
              )}
            >
              {(title || showClose) && (
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">{title}</h2>
                  {showClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="size-[18px]" />
                    </button>
                  )}
                </div>
              )}
              <div className="p-5">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // Bottom sheet on mobile, centered modal on lg+
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay — shown for both variants */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Desktop: centered modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed left-1/2 top-1/2 z-[101] hidden w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card shadow-2xl border border-border lg:block",
              className,
            )}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold">{title}</h2>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-[18px]" />
                  </button>
                )}
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>

          {/* Mobile: bottom sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[101] flex max-h-[90dvh] flex-col rounded-t-2xl bg-card shadow-2xl lg:hidden",
              className,
            )}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
            {(title || showClose) && (
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">{title}</h2>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-[18px]" />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
