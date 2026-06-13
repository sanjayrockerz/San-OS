"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { MOBILE_NAV, type NavItem } from "./nav-config";

export function BottomNav() {
  const pathname = usePathname();
  const openAddEntry = useUIStore((s) => s.setAddEntryOpen);

  const left = MOBILE_NAV.slice(0, 2);
  const right = MOBILE_NAV.slice(2);

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <motion.button
        type="button"
        aria-label="Add learning entry"
        onClick={() => openAddEntry(true)}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="absolute -top-5 left-1/2 z-10 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40"
      >
        <Plus className="size-6" />
      </motion.button>

      <div className="glass flex h-16 items-stretch border-t border-border">
        <div className="flex flex-1">
          {left.map((item) => (
            <Tab key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
        </div>
        <div className="w-14 shrink-0" />
        <div className="flex flex-1">
          {right.map((item) => (
            <Tab key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className={cn("size-5 transition-transform", active && "scale-110")} />
      {item.shortLabel}
    </Link>
  );
}
