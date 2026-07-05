"use client";

import { Activity, Clock, Zap, Target, BarChart2 } from "lucide-react";

interface AnalyticsData {
  deepWorkHours: number;
  totalProductiveHours: number;
  averageFocusScore: number;
  estimatedVsActualRatio: number;
}

export function ExecutionDashboard() {
  // In a real application, this data would come from the AnalyticsService API.
  const data: AnalyticsData = {
    deepWorkHours: 4.5,
    totalProductiveHours: 7.2,
    averageFocusScore: 88,
    estimatedVsActualRatio: 0.95, // Under-estimated by 5%
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-foreground">
        <BarChart2 className="w-5 h-5" />
        <h2 className="text-xl font-medium tracking-tight">Execution Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border bg-card hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Deep Work</h3>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight">{data.deepWorkHours}<span className="text-base text-muted-foreground font-normal ml-1">hrs</span></p>
          <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
            <span>↑ 12% from last week</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border bg-card hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Productive Time</h3>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight">{data.totalProductiveHours}<span className="text-base text-muted-foreground font-normal ml-1">hrs</span></p>
          <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
            <span>↑ 5% from last week</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border bg-card hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Focus Score</h3>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight">{data.averageFocusScore}</p>
          <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${data.averageFocusScore}%` }} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl border bg-card hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Est vs Actual</h3>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight">{(data.estimatedVsActualRatio * 100).toFixed(0)}<span className="text-base text-muted-foreground font-normal ml-1">%</span></p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Optimized planning accuracy</span>
          </div>
        </div>
      </div>
      
      {/* Visual Chart area (Simulated CSS grid chart) */}
      <div className="p-6 rounded-2xl border bg-card mt-6">
        <h3 className="text-sm font-medium text-foreground mb-6">Weekly Deep Work Distribution</h3>
        <div className="flex items-end gap-2 h-40">
          {[3, 5, 4, 6, 4.5, 2, 1].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 group">
              <div 
                className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all relative" 
                style={{ height: `${(val / 8) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-muted-foreground bg-background border px-2 py-1 rounded shadow-sm">
                  {val}h
                </div>
              </div>
              <span className="text-xs text-muted-foreground uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
