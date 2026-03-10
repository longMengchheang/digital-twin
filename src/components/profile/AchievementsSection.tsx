"use client";

import { Award } from "lucide-react";
import { AchievementCard } from "./AchievementCard";

export interface AchievementsSectionProps {
  badges: string[];
}

const BADGE_META: Record<string, { icon: string; description: string; colorClass: string }> = {
  "First Quest": {
    icon: "Q1",
    description: "Completed your first quest and started building momentum.",
    colorClass: "bg-cyan-500/15 text-cyan-300",
  },
  "Week Warrior": {
    icon: "7D",
    description: "Cleared enough quests to prove you can stay consistent for a full week.",
    colorClass: "bg-violet-500/15 text-violet-300",
  },
  "Level 10": {
    icon: "L10",
    description: "Reached double-digit level progression.",
    colorClass: "bg-amber-500/15 text-amber-300",
  },
  "Streak Master": {
    icon: "30D",
    description: "Kept your daily check-ins alive for 30 days.",
    colorClass: "bg-orange-500/15 text-orange-300",
  },
  Mindful: {
    icon: "ZEN",
    description: "Logged enough check-ins to establish a strong reflection habit.",
    colorClass: "bg-emerald-500/15 text-emerald-300",
  },
  "Early Bird": {
    icon: "AM",
    description: "Checked in early and set the tone before the day sped up.",
    colorClass: "bg-sky-500/15 text-sky-300",
  },
  "Weekend Warrior": {
    icon: "WKD",
    description: "Stayed active even when the schedule was supposed to be lighter.",
    colorClass: "bg-fuchsia-500/15 text-fuchsia-300",
  },
  "Night Owl": {
    icon: "PM",
    description: "Logged late-night effort when most systems were already offline.",
    colorClass: "bg-indigo-500/15 text-indigo-300",
  },
};

export function AchievementsSection({ badges }: AchievementsSectionProps) {
  if (!badges.length) {
    return (
      <section className="w-full">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
          <Award className="h-4 w-4 text-status-warning" />
          Achievements
        </h2>

        <div className="rounded-xl border border-dashed border-border/50 bg-bg-panel/10 py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Award className="h-8 w-8 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">No achievements yet</p>
            <p className="text-xs text-text-secondary">Complete quests and daily logs to unlock badges</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
        <Award className="h-4 w-4 text-status-warning" />
        Achievements
      </h2>

      <div className="space-y-3">
        {badges.map((badge) => {
          const meta = BADGE_META[badge] || {
            icon: "NEW",
            description: "Unlocked through your recent activity.",
            colorClass: "bg-accent-primary/15 text-accent-primary",
          };

          return (
            <AchievementCard
              key={badge}
              id={badge}
              icon={meta.icon}
              title={badge}
              description={meta.description}
              isUnlocked
              colorClass={meta.colorClass}
            />
          );
        })}
      </div>
    </section>
  );
}

export default AchievementsSection;
