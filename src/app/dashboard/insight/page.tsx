"use client";

import { useRef } from "react";
import InsightCards, { InsightCardsHandle } from "@/components/InsightCards";
import { RefreshCw, Sparkles } from "lucide-react";

export default function InsightPage() {
  const insightCardsRef = useRef<InsightCardsHandle>(null);

  const handleRefresh = async () => {
    await insightCardsRef.current?.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in space-y-6 pb-10 text-text-primary">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Today&apos;s Twin Report</h1>
            <p className="text-sm text-text-muted">A daily perspective from your digital twin</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-border bg-bg-panel px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent-primary/30 hover:bg-bg-card hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Insight Cards */}
      <InsightCards ref={insightCardsRef} />
    </div>
  );
}
