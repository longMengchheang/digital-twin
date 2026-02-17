"use client";

import React from "react";

export type StatColor = "amber" | "emerald" | "violet" | "cyan";

export interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: StatColor;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

// Color mapping for different stat types
const colorMap: Record<StatColor, { bg: string; iconBg: string; iconColor: string; ring: string }> = {
  amber: {
    bg: "bg-amber-500/10",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    ring: "ring-amber-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  violet: {
    bg: "bg-violet-500/10",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    ring: "ring-violet-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    ring: "ring-cyan-500/20",
  },
};

/**
 * StatCard - Displays individual statistics with icon, value, and label
 * Used in a 2x2 grid layout for main stats
 */
export function StatCard({ icon, value, label, color, trend }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`
        group relative flex flex-col rounded-2xl p-4 
        bg-white/5 border border-white/5 backdrop-blur-sm 
        hover:bg-white/10 transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-lg
      `}
    >
      {/* Icon Wrapper */}
      <div
        className={`
          flex h-10 w-10 items-center justify-center rounded-lg
          ${colors.iconBg}
        `}
      >
        <span className={colors.iconColor}>{icon}</span>
      </div>

      {/* Value */}
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        
        {/* Trend indicator */}
        {trend && (
          <span
            className={`
              text-sm font-medium
              ${trend.direction === "up" ? "text-emerald-400" : "text-red-400"}
            `}
          >
            {trend.direction === "up" ? "\\u2191" : "\\u2193"} {trend.value}%
          </span>
        )}
      </div>

      {/* Label */}
      <span className="mt-0.5 text-sm font-medium text-gray-400">{label}</span>

      {/* Subtle gradient overlay on hover */}
      <div
        className={`
          absolute inset-0 rounded-2xl bg-linear-to-br from-white/5 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          pointer-events-none
        `}
      />
    </div>
  );
}

export default StatCard;
