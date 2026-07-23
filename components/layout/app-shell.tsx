"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";
import { TopHeader } from "./top-header";
import { CommandPalette } from "./command-palette";
import { AddEntryModal } from "./add-entry-modal";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { ContextDrawer } from "./context-drawer";

interface AppShellUser {
  displayName: string;
  email: string | null;
}

export function AppShell({
  children,
  user,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  user: AppShellUser;
  unreadCount?: number;
}) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Sidebar user={user} />
      <MobileNavDrawer user={user} />
      <CommandPalette />
      <AddEntryModal />

      <div className={cn("flex min-h-dvh transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]")}>
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <TopHeader unreadCount={unreadCount} />
          <main className="flex-1 max-w-full overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1440px] px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
              {children}
            </div>
          </main>
        </div>
        <ContextDrawer />
      </div>

      <BottomNav />
    </div>
  );
}
