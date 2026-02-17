"use client";

import React from "react";
import { User } from "lucide-react";

export interface ProfileHeaderProps {
  name: string;
  avatarStage: string;
  level: number;
  currentXP: number;
  requiredXP: number;
}

/**
 * ProfileHeader - Main focal point of the profile page
 * Displays avatar, username, level, and XP progress with Duolingo-style glow effects
 */
export function ProfileHeader({
  name,
  avatarStage,
  level,
  currentXP,
  requiredXP,
}: ProfileHeaderProps) {
  // Calculate XP percentage
  const xpPercent = requiredXP > 0 ? Math.round((currentXP / requiredXP) * 100) : 0;

  return (
    <section className="relative flex flex-col items-center rounded-3xl bg-linear-to-b from-violet-500/10 to-transparent py-8 px-6">
      {/* Avatar Ring with Glow Effect */}
      <div className="relative">
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 p-1 shadow-[0_0_30px_rgba(139,92,246,0.4)] animate-pulse"
          style={{
            animationDuration: "3s",
          }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1a1d29]">
            <User className="h-14 w-14 text-white" strokeWidth={1.8} />
          </div>
        </div>

        {/* Level Badge */}
        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full bg-linear-to-r from-violet-600 to-violet-500 px-4 py-1 text-sm font-bold text-white shadow-lg">
          <span>Level</span>
          <span className="ml-1">{level}</span>
        </div>
      </div>

      {/* Username */}
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">{name}</h1>

      {/* Subtitle / Avatar Stage */}
      <p className="mt-1 text-sm font-medium text-gray-400">{avatarStage}</p>

      {/* XP Progress Bar */}
      <div className="mt-6 w-full max-w-sm px-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
            style={{
              width: `${xpPercent}%`,
              backgroundSize: "200% 100%",
              animation: "xpShimmer 2s linear infinite",
            }}
          />
        </div>

        {/* XP Label */}
        <div className="mt-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
          <span>Level {level}</span>
          <span>
            {currentXP} / {requiredXP} XP
          </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes xpShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </section>
  );
}

export default ProfileHeader;
