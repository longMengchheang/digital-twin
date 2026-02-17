"use client";

import React from "react";
import { Award } from "lucide-react";
import { AchievementCard, AchievementCardProps } from "./AchievementCard";

export interface AchievementsSectionProps {
  badges: string[];
  onBadgeClick?: (badge: string) => void;
}

// Badge metadata mapping
const badgeMetadata: Record<string, { description: string; icon: string }> = {
  "First Quest": {
    description: "Complete your first quest to unlock this badge",
    icon: "🏁",
  },
  "Week Warrior": {
    description: "Complete quests on weekends",
    icon: "⚔️",
  },
  "Level 10": {
    description: "Reach level 10 in your journey",
    icon: "🎯",
  },
  "Streak Master": {
    description: "Maintain a long streak of daily check-ins",
    icon: "🔥",
  },
  "Mindful": {
    description: "Complete mindfulness-related quests",
    icon: "🧠",
  },
  "Early Bird": {
    description: "Check in before 8 AM",
    icon: "🌅",
  },
  "Weekend Warrior": {
    description: "Complete quests on weekends",
    icon: "🌲",
  },
  "Night Owl": {
    description: "Check in late at night",
    icon: "🦉",
  },
};

/**
 * AchievementsSection - Vertical list of achievement cards
 * Displays user's badges as unlockable achievements
 */
export function AchievementsSection({ badges, onBadgeClick }: AchievementsSectionProps) {
  return (
    <section className="rounded-2xl bg-slate-800/30 p-4 backdrop-blur-sm">
      {/* Section Title */}
      <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        <Award className="h-3.5 w-3.5 text-amber-400" />
        Achievements
      </h2>

      {/* Achievement List */}
      {badges.length > 0 ? (
        <div className="flex flex-col gap-3">
          {badges.map((badge) => {
            const metadata = badgeMetadata[badge] || {
              description: "Achievement unlocked",
              icon: "🏆",
            };

            const achievement: AchievementCardProps = {
              id: badge,
              icon: metadata.icon,
              title: badge,
              description: metadata.description,
              isUnlocked: true,
            };

            return (
              <div
                key={badge}
                onClick={() => onBadgeClick?.(badge)}
                className={onBadgeClick ? "cursor-pointer" : ""}
              >
                <AchievementCard {...achievement} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-700 bg-slate-900/30 py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Award className="h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-500">No achievements yet</p>
            <p className="text-xs text-gray-600">Complete quests to earn badges</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default AchievementsSection;
