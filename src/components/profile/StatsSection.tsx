"use client";

import React from "react";
import { Activity } from "lucide-react";

export interface StatsSectionProps {}

/**
 * StatsSection - empty container displaying key statistics state
 */
export function StatsSection({}: StatsSectionProps) {
  return (
    <section className="h-full rounded-2xl border border-border bg-bg-card p-6 shadow-xl relative overflow-hidden flex flex-col">
      {/* Background glow flavor */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-primary/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Section Title */}
      <h2 className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted relative z-10">
        <Activity className="h-4 w-4 text-accent-primary" />
        Statistics
      </h2>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-bg-panel/10 py-12 text-center relative z-10">
        <div className="flex flex-col items-center gap-2">
          <Activity className="h-8 w-8 text-text-muted opacity-50 mb-1" />
          <p className="text-sm font-semibold text-text-primary">No statistics available</p>
          <p className="text-xs text-text-secondary">Complete activities to generate data</p>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
