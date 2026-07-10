"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MissionHeroV2 } from "./mission-hero-v2";
import { KpiCard } from "./kpi-card";
import { KpiCarousel } from "./kpi-carousel";
import type { HeroTheme } from "@/lib/mission-control/hero-theme-engine";
import type { DashboardData } from "./dashboard-data-fetcher";

interface MissionControlClientProps {
  theme: HeroTheme;
  name: string;
  formattedTime: string;
  data: DashboardData;
}

const SECTION_ITEMS: { id: string; label: string }[] = [
  { id: "readiness", label: "Placement Readiness" },
  { id: "focus", label: "Today's Focus" },
  { id: "streak", label: "Study Streak" },
  { id: "projects", label: "Projects" },
  { id: "planner", label: "Planner" },
  { id: "finance", label: "Finance" },
  { id: "academic", label: "Academic" },
  { id: "dsa", label: "DSA" },
  { id: "business", label: "Business" },
  { id: "health", label: "Health" },
  { id: "knowledge", label: "Knowledge" },
  { id: "relationships", label: "Relationships" },
];

export function MissionControlClient({
  theme,
  name,
  formattedTime,
  data,
}: MissionControlClientProps) {
  return (
    <>
      <MissionHeroV2
        theme={theme}
        time={formattedTime}
        coachInsight={data.coachInsight}
        estimatedMinutes={data.estimatedMinutes}
        priorityCount={data.priorityCount}
        mission={data.topPriorityTitle}
        planner={data.planner}
      />

      <section className="mb-6">
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Key Metrics
        </h2>
        <KpiCarousel widgets={data.widgets} data={data.kpis} />
      </section>

      <section className="space-y-3">
        {SECTION_ITEMS.map((section, i) => {
          const kpi = data.kpis[section.id];
          if (!kpi) return null;
          const widget = data.widgets.find((w) => w.id === section.id);
          if (!widget) return null;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.35,
                delay: i * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <KpiCard
                icon={widget.icon}
                label={section.label}
                value={kpi.value}
                subtitle={kpi.subtitle}
                trend={kpi.trend}
                sparklineData={kpi.sparklineData}
                progress={kpi.progress}
                insight={kpi.insight}
                gradient={widget.gradient}
                darkGradient={widget.darkGradient}
                color={widget.color}
                delay={i}
              />
            </motion.div>
          );
        })}
      </section>
    </>
  );
}
