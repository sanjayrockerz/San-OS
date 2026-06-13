"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";
import { TopHeader } from "./top-header";
import { CommandPalette } from "./command-palette";
import { AddEntryModal } from "./add-entry-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <CommandPalette />
      <AddEntryModal />

      <div className={cn("transition-[padding] duration-200 ease-out", collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]")}>
        <TopBar />
        <TopHeader />
        <main>
          <div className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
