"use client";

import { ReactNode } from "react";
import { AlertCircle, ArrowRight, Bot, CheckCircle2, MessageSquareQuote } from "lucide-react";

interface TodayStatusCardProps {
  completed: boolean;
  summary: string;
  activityCount: number;
  mainTheme: string;
  onStartCheckIn?: () => void;
}

interface ReflectionCardProps {
  reflection: string;
  className?: string;
}

interface InsightStatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "violet" | "emerald" | "amber";
}

const statToneMap: Record<InsightStatCardProps["tone"], string> = {
  violet: "border-accent-primary/20 bg-bg-panel text-accent-hover",
  emerald: "border-status-success/20 bg-bg-panel text-status-success",
  amber: "border-status-warning/20 bg-bg-panel text-status-warning",
};

export function TodayStatusCard({
  completed,
  summary,
  activityCount,
  mainTheme,
  onStartCheckIn,
}: TodayStatusCardProps) {
  const incompleteSummary =
    "Your twin hasn't seen today's activity yet. Log your day to reveal today's insight.";

  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl border p-6 sm:p-7",
        "transition-all duration-300",
        completed
          ? "border-status-success/22 bg-linear-to-br from-[#121A18] via-bg-panel to-[#111824] shadow-[0_20px_50px_rgba(0,0,0,0.24)] hover:-translate-y-0.5 hover:border-status-success/40 hover:shadow-[0_24px_64px_rgba(0,0,0,0.3)]"
          : "twin-log-waiting border-status-warning/45 bg-linear-to-br from-[#2A1F13] via-[#171923] to-[#17140F] shadow-[0_24px_68px_rgba(251,191,36,0.12)] hover:-translate-y-0.5 hover:border-status-warning/70 hover:shadow-[0_26px_80px_rgba(251,191,36,0.2)]",
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl",
          completed ? "bg-status-success/20" : "bg-status-warning/15",
        ].join(" ")}
      />
      {!completed && (
        <div className="twin-waiting-aura pointer-events-none absolute -bottom-10 -left-14 h-44 w-44 rounded-full bg-status-warning/20 blur-3xl" />
      )}

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">
            Today&apos;s Log
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {completed ? "Complete" : "Not Complete"}
          </h2>
        </div>

        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            completed
              ? "border-status-success/30 bg-status-success/10 text-[#6EE7B7]"
              : "border-status-warning/45 bg-status-warning/15 text-[#FCD34D]",
          ].join(" ")}
        >
          {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {completed ? "Logged" : "Waiting for check-in"}
        </span>
      </div>

      <p className="relative z-10 mt-5 max-w-3xl text-base leading-relaxed text-[#D1D5DB]">
        {completed ? summary : incompleteSummary}
      </p>

      <div className="relative z-10 mt-6 flex flex-wrap gap-2">
        {completed ? (
          <>
            <span className="rounded-full border border-border bg-bg-base/70 px-3 py-1 text-xs font-medium text-text-secondary">
              {activityCount} {activityCount === 1 ? "activity" : "activities"} today
            </span>
            <span className="rounded-full border border-border bg-bg-base/70 px-3 py-1 text-xs font-medium text-text-secondary">
              Main theme: {mainTheme || "General"}
            </span>
            <span className="rounded-full border border-status-success/30 bg-status-success/10 px-3 py-1 text-xs font-semibold text-[#6EE7B7]">
              Reflection unlocked
            </span>
          </>
        ) : (
          <span className="rounded-full border border-status-warning/35 bg-status-warning/10 px-3 py-1 text-xs font-medium text-[#FCD34D]">
            Your twin is waiting for today&apos;s data
          </span>
        )}
      </div>

      {!completed && (
        <div className="relative z-10 mt-6 flex justify-end">
          <button
            type="button"
            onClick={onStartCheckIn}
            className="twin-cta-pulse inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-accent-primary to-accent-hover px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
          >
            Start Daily Check-In
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </article>
  );
}

export function ReflectionCard({ reflection, className = "" }: ReflectionCardProps) {
  return (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border border-border bg-bg-panel p-6 shadow-[0_16px_48px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-primary/35 hover:shadow-[0_22px_56px_rgba(0,0,0,0.34)] sm:p-7",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-accent-primary/10 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-primary/25 bg-accent-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-glow">
          <Bot className="h-3.5 w-3.5" />
          Daily Reflection
        </div>
        <p className="max-w-4xl text-base leading-8 text-text-primary sm:text-lg">
          {reflection || "Your twin is still observing today. Log your day to reveal a deeper reflection."}
        </p>
      </div>
    </article>
  );
}

export function InsightStatCard({ label, value, icon, tone }: InsightStatCardProps) {
  return (
    <article className="group rounded-xl border border-border bg-bg-panel p-4 shadow-[0_8px_28px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3B4260] hover:shadow-[0_16px_38px_rgba(0,0,0,0.34)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
        <span className={["inline-flex rounded-lg border p-2 transition-transform duration-300 group-hover:scale-105", statToneMap[tone]].join(" ")}>{icon}</span>
      </div>
      <p className="truncate text-xl font-bold text-white">{value}</p>
    </article>
  );
}

export function InsightSectionHeader() {
  return (
    <div className="group mb-1 inline-flex items-center gap-2 rounded-full border border-border bg-bg-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3B4260] hover:bg-[#171b2a] hover:text-text-secondary">
      <MessageSquareQuote className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-105" />
      Supporting Signals
    </div>
  );
}
