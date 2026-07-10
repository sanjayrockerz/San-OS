"use client";

import { useUIStore } from "@/store/ui-store";
import { TodaysMission } from "./todays-mission";
import type { DailyCoachBrief, StudentAction } from "@/lib/services";

export function TodaysMissionWrapper({
  brief,
  priorities,
}: {
  brief: DailyCoachBrief;
  priorities: StudentAction[];
}) {
  const openAddEntry = useUIStore((s) => s.setAddEntryOpen);
  return (
    <TodaysMission
      brief={brief}
      priorities={priorities}
      onAddPriority={() => openAddEntry(true)}
    />
  );
}
