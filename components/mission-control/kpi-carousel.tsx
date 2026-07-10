"use client";

import { useRef, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DashboardWidget } from "@/lib/mission-control/dashboard-widgets";
import { KpiCard } from "./kpi-card";

interface KpiData {
  id: string;
  value: string;
  subtitle: string;
  trend?: number;
  sparklineData?: number[];
  progress?: number;
  insight?: string;
}

interface KpiCarouselProps {
  widgets: DashboardWidget[];
  data: Record<string, KpiData>;
}

export function KpiCarousel({ widgets, data }: KpiCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  const scroll = useCallback(
    (dir: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;
      const amount = 280;
      el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
      setTimeout(updateScrollState, 200);
    },
    [updateScrollState],
  );

  return (
    <div className="relative -mx-4 md:mx-0">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-lg backdrop-blur-sm"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0 lg:grid-cols-3 xl:grid-cols-4"
      >
        {widgets.map((widget, i) => {
          const kpi = data[widget.id];
          if (!kpi) return null;
          return (
            <div key={widget.id} className="w-[260px] shrink-0 snap-start md:w-auto">
              <KpiCard
                icon={widget.icon}
                label={widget.title}
                value={kpi.value}
                subtitle={kpi.subtitle}
                trend={kpi.trend}
                sparklineData={kpi.sparklineData}
                progress={kpi.progress}
                insight={kpi.insight}
                gradient={widget.gradient}
                darkGradient={widget.darkGradient}
                color={widget.color}
                size={widget.size}
                delay={i}
              />
            </div>
          );
        })}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-lg backdrop-blur-sm"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}