"use client";

import { Activity, Flame, ListChecks, Target } from "lucide-react";
import type { ProfileMood } from "./ProfilePage";
import { StatCard } from "./StatCard";

export interface StatsSectionProps {
  dailyStreak: number;
  totalQuests: number;
  completedQuests: number;
  currentMood?: ProfileMood;
}

export function StatsSection({
  dailyStreak,
  totalQuests,
  completedQuests,
  currentMood,
}: StatsSectionProps) {
  const completionRate = totalQuests > 0
    ? Math.round((completedQuests / totalQuests) * 100)
    : 0;

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-card p-6 shadow-xl">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-primary/5 blur-2xl pointer-events-none" />

      <h2 className="relative z-10 mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        <Activity className="h-4 w-4 text-accent-primary" />
        Statistics
      </h2>

      <div className="relative z-10 grid gap-4 sm:grid-cols-2 md:grid-cols-1">
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          value={dailyStreak}
          label="Day Streak"
          color="amber"
        />
        <StatCard
          icon={<ListChecks className="h-5 w-5" />}
          value={completedQuests}
          label="Quests Cleared"
          color="emerald"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          value={`${completionRate}%`}
          label="Quest Completion"
          color="violet"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          value={currentMood ? `${currentMood.emoji} ${currentMood.label}` : "No data"}
          label="Current Mood"
          color="cyan"
        />
      </div>
    </section>
  );
}

export default StatsSection;
