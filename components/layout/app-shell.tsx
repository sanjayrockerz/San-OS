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

      <div className={cn("flex min-h-dvh transition-[padding] duration-200 ease-out", collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]")}>
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <TopHeader unreadCount={unreadCount} />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
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
