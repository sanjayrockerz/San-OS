"use client";

import { GraduationCap, ArrowUpRight, AlertTriangle, CalendarCheck } from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { iitCourses, upcomingDeadlines } from "@/lib/mock-data";

export default function IITWorkspacePage() {
  return (
    <PageTransition>
      <PageHeader
        title="IIT Workspace"
        description="Your BS degree, organized. Courses, lectures and deadlines beside your DSA prep."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section className="lg:col-span-2">
          <SectionHeading title="Courses" />
          <div className="grid gap-3 sm:grid-cols-2">
            {iitCourses.map((c) => (
              <div key={c.id} className="surface-card group cursor-pointer rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <GraduationCap className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{c.code}</p>
                <h3 className="text-[15px] font-semibold tracking-tight">{c.title}</h3>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold tabular">{c.progress}%</span>
                </div>
                <Progress value={c.progress} className="mt-1.5 h-1.5" />
                <div className="mt-4 rounded-lg border border-border bg-background-subtle/40 p-2.5">
                  <p className="text-[11px] text-muted-foreground">Up next</p>
                  <p className="truncate text-sm font-medium">{c.nextItem}</p>
                  <p className="mt-0.5 text-[11px] text-primary">Due {c.due}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <SectionHeading title="Deadlines" />
          <div className="surface-card space-y-2.5 rounded-2xl p-4">
            {upcomingDeadlines.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", d.urgent ? "bg-danger/12 text-danger" : "bg-muted text-muted-foreground")}>
                  {d.urgent ? <AlertTriangle className="size-4" /> : <CalendarCheck className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-[11px] text-muted-foreground">{d.course}</p>
                </div>
                <Badge variant={d.urgent ? "danger" : "secondary"}>{d.due}</Badge>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}
