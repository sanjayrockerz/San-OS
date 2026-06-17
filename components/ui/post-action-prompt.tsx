"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, BookOpen, Link as LinkIcon, Edit3, ArrowRight, Video, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUIStore, type PostActionVariant } from "@/store/ui-store";

export function PostActionPrompt() {
  const { postActionPrompt, setPostActionPrompt } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    if (postActionPrompt) {
      const timer = setTimeout(() => {
        setPostActionPrompt(null);
      }, 10000); // 10 seconds auto-dismiss
      return () => clearTimeout(timer);
    }
  }, [postActionPrompt, setPostActionPrompt]);

  if (!postActionPrompt) return null;

  const { variant, entityId, entityTitle } = postActionPrompt;

  let title = "What next?";
  let actions: { label: string; href: string; icon: React.ElementType; primary?: boolean }[] = [];

  switch (variant) {
    case "after-solve":
      title = "Problem Solved";
      actions = [
        { label: "Create concept note", href: `/concepts/new?problem_id=${entityId}`, icon: Sparkles, primary: true },
        { label: "Write detailed reflection", href: `/problems/${entityId}#reflection`, icon: Edit3 },
        { label: "Attach code screenshot", href: `/problems/${entityId}#media`, icon: Video },
        { label: "Start similar problem", href: "/problems/new", icon: ArrowRight },
      ];
      break;
    case "after-concept":
      title = "Concept Created";
      actions = [
        { label: "Link related problems", href: `/concepts/${entityId}#links`, icon: LinkIcon, primary: true },
        { label: "Attach vault resources", href: `/concepts/${entityId}#vault`, icon: Library },
      ];
      break;
    case "after-vault":
      title = "Resource Saved";
      actions = [
        { label: "Link to concept", href: `/vault/${entityId}#link`, icon: LinkIcon, primary: true },
        { label: "Draft new concept", href: `/concepts/new?vault_id=${entityId}`, icon: Sparkles },
      ];
      break;
    case "after-iit":
      title = "Assignment Complete";
      actions = [
        { label: "Save notes to vault", href: `/vault/new?iit_id=${entityId}`, icon: FileText, primary: true },
        { label: "Review course syllabus", href: "/iit-workspace", icon: BookOpen },
      ];
      break;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl border border-primary/20 bg-card p-5 shadow-2xl"
      >
        <button
          onClick={() => setPostActionPrompt(null)}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {title}
          </p>
          <p className="mt-1 line-clamp-1 text-sm font-medium text-foreground">
            {entityTitle}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.primary ? "default" : "outline"}
              className="w-full justify-start gap-3"
              onClick={() => {
                setPostActionPrompt(null);
                router.push(action.href);
              }}
            >
              <action.icon className="size-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Temporary Library icon placeholder since I forgot to import it above
function Library(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  );
}
