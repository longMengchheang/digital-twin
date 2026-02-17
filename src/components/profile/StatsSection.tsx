"use client";

import React from "react";
import { Activity, Award, Flame, Heart, Swords } from "lucide-react";
import { StatCard } from "./StatCard";

export interface StatsSectionProps {
  dailyStreak: number;
  completedQuests: number;
  totalQuests: number;
  currentMood: {
    emoji: string;
    label: string;
  };
  badgesCount: number;
}

/**
 * StatsSection - 2x2 grid displaying key statistics
 * Shows Day Streak, Quests Completed, Current Mood, and Badges
 */
export function StatsSection({
  dailyStreak,
  completedQuests,
  totalQuests,
  currentMood,
  badgesCount,
}: StatsSectionProps) {
  return (
    <section className="rounded-2xl bg-slate-800/30 p-4 backdrop-blur-sm">
      {/* Section Title */}
      <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        <Activity className="h-3.5 w-3.5" />
        Statistics
      </h2>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Day Streak - Amber */}
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          value={dailyStreak}
          label="Day Streak"
          color="amber"
        />

        {/* Quests Completed - Emerald */}
        <StatCard
          icon={<Swords className="h-5 w-5" />}
          value={`${completedQuests}/${totalQuests}`}
          label="Quests Done"
          color="emerald"
        />

        {/* Current Mood - Violet */}
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          value={currentMood.emoji}
          label={currentMood.label}
          color="violet"
        />

        {/* Badges - Cyan */}
        <StatCard
          icon={<Award className="h-5 w-5" />}
          value={badgesCount}
          label="Badges Earned"
          color="cyan"
        />
      </div>
    </section>
  );
}

export default StatsSection;
