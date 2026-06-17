import { requireContext } from "@/lib/server/context";
import {
  TimelineClient,
  type TimelineDay,
} from "@/components/timeline/timeline-client";

function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function dayLabel(date: Date): string {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  if (date.toDateString() === today) return "Today";
  if (date.toDateString() === yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function TimelinePage() {
  const { user, services } = await requireContext("/timeline");

  const items = await services.timeline.getUserTimeline(user.id, 150);

  // Group by calendar day
  const groupMap = new Map<string, typeof items>();
  for (const item of items) {
    const dateKey = new Date(item.at).toISOString().slice(0, 10);
    if (!groupMap.has(dateKey)) groupMap.set(dateKey, []);
    groupMap.get(dateKey)!.push(item);
  }

  const days: TimelineDay[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, entries]) => ({
      dateKey,
      label: dayLabel(new Date(dateKey)),
      entries: entries.map((e) => ({
        ...e,
        timeLabel: timeOfDay(e.at),
      })),
    }));

  return <TimelineClient days={days} totalEvents={items.length} />;
}
