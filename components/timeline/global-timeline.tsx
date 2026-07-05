"use client";

import { useEffect, useState } from "react";

import { Activity, Clock, CheckCircle, FileText, Zap, Brain, MessageSquare } from "lucide-react";

export interface TimelineEvent {
  id: string;
  event_type: string;
  entity_type: string;
  payload: any;
  created_at: string;
  parent_event_id?: string | null;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function GlobalTimeline({ userId }: { userId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation this would fetch from a server action or route.
    // For now we simulate an empty fetch as we are building the UI layer.
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events?limit=50");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getEventIcon = (type: string) => {
    if (type.includes("problem")) return <Brain className="w-4 h-4 text-purple-500" />;
    if (type.includes("block") || type.includes("session")) return <Clock className="w-4 h-4 text-blue-500" />;
    if (type.includes("invoice") || type.includes("paid")) return <Zap className="w-4 h-4 text-yellow-500" />;
    if (type.includes("capture") || type.includes("voice")) return <MessageSquare className="w-4 h-4 text-green-500" />;
    if (type.includes("revision")) return <CheckCircle className="w-4 h-4 text-teal-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const formatEventText = (event: TimelineEvent) => {
    const description = event.payload?.description || event.payload?.title || event.event_type.replace(/_/g, " ");
    return description;
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-secondary rounded-lg w-full"></div>
      ))}
    </div>;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed rounded-xl">
        <Activity className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-sm">No timeline events yet.</p>
      </div>
    );
  }

  // Group events by parent_event_id
  const groupedEvents: { event: TimelineEvent; children: TimelineEvent[] }[] = [];
  const eventMap = new Map<string, TimelineEvent>();
  
  events.forEach(e => eventMap.set(e.id, e));

  events.forEach(e => {
    if (e.parent_event_id && eventMap.has(e.parent_event_id)) {
      // It's a child event, handled in the next pass
    } else {
      groupedEvents.push({ event: e, children: [] });
    }
  });

  events.forEach(e => {
    if (e.parent_event_id) {
      const parent = groupedEvents.find(g => g.event.id === e.parent_event_id);
      if (parent) {
        parent.children.push(e);
      } else {
        // Parent not in current batch, treat as root
        groupedEvents.push({ event: e, children: [] });
      }
    }
  });

  return (
    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {groupedEvents.map(({ event, children }) => (
        <div key={event.id} className="relative flex flex-col md:flex-row items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {getEventIcon(event.event_type)}
          </div>
          
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-14 md:ml-0 p-4 rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {event.event_type.replace(/_/g, " ")}
              </span>
              <p className="text-sm text-foreground leading-snug">
                {formatEventText(event)}
              </p>
              <time className="text-xs text-muted-foreground/70 mt-1">
                {timeAgo(event.created_at)}
              </time>
              
              {children.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {children.map(child => (
                    <div key={child.id} className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0">
                        {getEventIcon(child.event_type)}
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground capitalize block mb-0.5">
                          {child.event_type.replace(/_/g, " ")}
                        </span>
                        <p className="text-xs text-foreground/90">
                          {formatEventText(child)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
