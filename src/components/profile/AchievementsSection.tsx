"use client";

import React from "react";
import { Award } from "lucide-react";

export interface AchievementsSectionProps {}

/**
 * AchievementsSection - Vertical list of achievement cards
 * Displays user's badges as unlockable achievements
 */
export function AchievementsSection({}: AchievementsSectionProps) {
  return (
    <section className="w-full">
      {/* Section Title */}
      <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
        <Award className="h-4 w-4 text-status-warning" />
        Achievements
      </h2>

      {/* Achievement List Empty State */}
      <div className="rounded-xl border border-dashed border-border/50 bg-bg-panel/10 py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <Award className="h-8 w-8 text-text-muted" />
          <p className="text-sm font-semibold text-text-primary">No achievements yet</p>
          <p className="text-xs text-text-secondary">Complete quests to earn badges</p>
        </div>
      </div>
    </section>
  );
}

export default AchievementsSection;
