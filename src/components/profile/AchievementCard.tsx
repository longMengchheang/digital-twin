"use client";

import React from "react";

export interface AchievementCardProps {
  id: string;
  icon: string | React.ReactNode;
  title: string;
  description: string;
  isUnlocked: boolean;
  progress?: {
    current: number;
    target: number;
  };
  unlockedAt?: string;
  colorClass?: string;
}

/**
 * AchievementCard - Displays badges/achievements with optional progress
 * Can be in unlocked or locked state with different styling
 */
export function AchievementCard({
  icon,
  title,
  description,
  isUnlocked,
  progress,
  unlockedAt,
  colorClass,
}: AchievementCardProps) {
  // Calculate progress percentage
  const progressPercent = progress
    ? Math.round((progress.current / progress.target) * 100)
    : 0;

  return (
    <div
      className={`
        group relative flex items-start gap-4 rounded-2xl p-4
        transition-all duration-300 hover:bg-bg-panel/40
        ${isUnlocked
          ? "border border-border/50 bg-bg-panel/20 hover:border-accent-primary/30"
          : "border border-dashed border-border/30 bg-bg-panel/5 opacity-60 hover:opacity-80 hover:border-border/50"
        }
      `}
    >
      {/* Badge Icon */}
      <div
        className={`
          flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl
          transition-transform duration-300 group-hover:scale-110
          ${isUnlocked
            ? colorClass || "bg-accent-primary/10 text-accent-primary"
            : "bg-bg-base text-text-muted grayscale"
          }
        `}
      >
        {typeof icon === "string" ? (
          <span>{icon}</span>
        ) : (
          icon
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1">
        {/* Title */}
        <h3 className={`font-semibold ${isUnlocked ? "text-text-primary" : "text-text-secondary"}`}>
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-secondary">{description}</p>

        {/* Progress Bar (when applicable) */}
        {progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Progress</span>
              <span>{progress.current} / {progress.target}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-bg-base/50">
              <div
                className="h-full rounded-full bg-accent-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Unlocked Date */}
        {isUnlocked && unlockedAt && (
          <p className="mt-1 text-xs text-text-muted">
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default AchievementCard;
