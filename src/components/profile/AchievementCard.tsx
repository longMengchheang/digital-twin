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
}: AchievementCardProps) {
  // Calculate progress percentage
  const progressPercent = progress
    ? Math.round((progress.current / progress.target) * 100)
    : 0;

  return (
    <div
      className={`
        group relative flex items-start gap-4 rounded-2xl p-4
        transition-all duration-300 hover:-translate-y-0.5
        ${isUnlocked
          ? "bg-linear-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20"
          : "bg-white/5 border border-white/5 opacity-60 hover:opacity-80"
        }
      `}
    >
      {/* Badge Icon */}
      <div
        className={`
          flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl
          shadow-lg transition-transform duration-300 group-hover:scale-110
          ${isUnlocked
            ? "bg-linear-to-br from-amber-400 to-amber-500"
            : "bg-gray-800 grayscale"
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
        <h3 className={`font-semibold ${isUnlocked ? "text-white" : "text-gray-400"}`}>
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400">{description}</p>

        {/* Progress Bar (when applicable) */}
        {progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progress.current} / {progress.target}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Unlocked Date */}
        {isUnlocked && unlockedAt && (
          <p className="mt-1 text-xs text-gray-500">
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default AchievementCard;
