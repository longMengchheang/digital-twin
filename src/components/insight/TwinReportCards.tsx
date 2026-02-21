"use client";

import { ReactNode } from "react";
import { AlertCircle, ArrowRight, Bot, CheckCircle2, MessageSquareQuote, Sparkles } from "lucide-react";

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
        "relative overflow-hidden rounded-2xl border p-8",
        "transition-all duration-300 bg-bg-card",
        completed
          ? "border-status-success/30 shadow-[0_0_40px_rgba(52,211,153,0.05)] hover:border-status-success/50 hover:shadow-[0_0_50px_rgba(52,211,153,0.1)]"
          : "border-status-warning/40 shadow-[0_0_40px_rgba(251,191,36,0.05)] hover:border-status-warning/60 hover:shadow-[0_0_50px_rgba(251,191,36,0.1)]",
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

      <div className="relative z-10 mt-6 flex flex-wrap gap-2.5">
        {completed ? (
          <>
            <span className="rounded-xl border border-border bg-bg-panel px-3 py-1.5 text-xs font-semibold text-text-secondary">
              {activityCount} {activityCount === 1 ? "activity" : "activities"} today
            </span>
            <span className="rounded-xl border border-border bg-bg-panel px-3 py-1.5 text-xs font-semibold text-text-secondary">
              Main theme: {mainTheme || "General"}
            </span>
            <span className="rounded-xl border border-status-success/30 bg-status-success/10 px-3 py-1.5 text-xs font-bold text-status-success flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Reflection unlocked
            </span>
          </>
        ) : (
          <span className="rounded-xl border border-status-warning/40 bg-status-warning/10 px-3 py-1.5 text-xs font-bold text-status-warning flex items-center gap-1.5">
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
        "group relative overflow-hidden rounded-2xl border border-border bg-bg-card p-6 shadow-xl transition-all duration-300 hover:border-accent-primary/40 hover:shadow-2xl sm:p-8",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-accent-primary/5 blur-3xl transition-opacity duration-500 group-hover:bg-accent-primary/10" />
      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-accent-primary/30 bg-accent-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-primary">
          <Bot className="h-4 w-4" />
          Daily Reflection
        </div>
        <p className="max-w-4xl text-base leading-relaxed text-text-primary sm:text-lg">
          {reflection || "Your twin is still observing today. Log your day to reveal a deeper reflection."}
        </p>
      </div>
    </article>
  );
}

export function InsightStatCard({ label, value, icon, tone }: InsightStatCardProps) {
  return (
    <article className="group rounded-2xl border border-border bg-bg-card p-5 shadow-lg transition-all duration-300 hover:border-accent-primary/30 hover:shadow-xl hover:-translate-y-0.5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
        <span className={["inline-flex rounded-xl border p-2.5 transition-transform duration-300 group-hover:scale-110", statToneMap[tone]].join(" ")}>{icon}</span>
      </div>
      <p className="truncate text-2xl font-bold text-white tracking-tight">{value}</p>
    </article>
  );
}

export function InsightSectionHeader() {
  return (
    <div className="group mb-2 inline-flex items-center gap-2 rounded-xl border border-border bg-bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-muted transition-all duration-300 hover:border-accent-primary/40 hover:text-white">
      <MessageSquareQuote className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
      Supporting Signals
    </div>
  );
}
