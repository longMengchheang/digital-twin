"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import { clamp } from "@/lib/math";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Loader2,
  Plus,
  Target,
  Trophy,
  Trash2,
  Zap,
} from "lucide-react";

interface Quest {
  id: string;
  goal: string;
  duration: string;
  progress: number;
  completed: boolean;
  createdAt: string;
  completedDate?: string;
  recurrencesLeft?: number;
}

interface QuestLogEntry {
  id: string;
  questId: string;
  goal: string;
  duration: string;
  progress: number;
  completedDate: string;
  createdDate: string;
  deletedDate?: string;
  isDeleted: boolean;
}


interface ToastMessage {
  id: number;
  title: string;
  message: string;
  tone: "success" | "error";
}

const durationMeta: Record<
  string,
  {
    label: string;
    reward: number;
    badgeClass: string;
    progressClass: string;
    icon: React.ReactNode;
  }
> = {
  daily: {
    label: "Daily",
    reward: 20,
    badgeClass: "border-accent-primary/30 bg-accent-primary/10 text-accent-hover",
    progressClass: "from-accent-primary to-accent-hover",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  weekly: {
    label: "Weekly",
    reward: 50,
    badgeClass: "border-status-success/30 bg-status-success/10 text-status-success",
    progressClass: "from-status-success to-[#6EE7B7]",
    icon: <Calendar className="h-3.5 w-3.5" />,
  },
  monthly: {
    label: "Monthly",
    reward: 150,
    badgeClass: "border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#22D3EE]",
    progressClass: "from-[#22D3EE] to-[#67E8F9]",
    icon: <Target className="h-3.5 w-3.5" />,
  },
  yearly: {
    label: "Yearly",
    reward: 500,
    badgeClass: "border-status-warning/30 bg-status-warning/10 text-status-warning",
    progressClass: "from-status-warning to-[#FCD34D]",
    icon: <Trophy className="h-3.5 w-3.5" />,
  },
};

const getDurationMeta = (durationKey: string) => {
  return durationMeta[durationKey.toLowerCase()] ?? durationMeta.daily;
};

export default function QuestLogPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questLogs, setQuestLogs] = useState<QuestLogEntry[]>([]);
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("daily");
  const [recurrences, setRecurrences] = useState("");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const checkAndResetQuests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.post("/api/quest/reset", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Failed to check quest reset:", error);
    }
  }, []);

  const activeQuests = useMemo(() => quests.filter((quest) => !quest.completed), [quests]);
  
  const completedQuestsStacked = useMemo(() => {
    const groups: Record<string, { goal: string; count: number; totalReward: number; duration: string }> = {};

    for (const log of questLogs) {
      const normalizedGoal = log.goal.trim().toLowerCase();

      if (!groups[normalizedGoal]) {
        groups[normalizedGoal] = {
          goal: log.goal,
          count: 0,
          totalReward: 0,
          duration: log.duration,
        };
      }

      groups[normalizedGoal].count += 1;
      groups[normalizedGoal].totalReward += getDurationMeta(log.duration).reward;
    }

    return Object.values(groups).sort((a, b) => b.totalReward - a.totalReward);
  }, [questLogs]);

  const totalXPGained = useMemo(() => {
    return questLogs.reduce((sum, log) => sum + getDurationMeta(log.duration).reward, 0);
  }, [questLogs]);


  const addToast = useCallback((title: string, message: string, tone: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const fetchQuests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("/api/quest/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = (response.data ?? []).map(
        (quest: {
          _id: string;
          goal: string;
          duration: string;
          progress?: number;
          completed?: boolean;
          date?: string;
          createdAt?: string;
          completedDate?: string;
        }) => ({
          id: quest._id,
          goal: quest.goal,
          duration: quest.duration,
          progress: Number(quest.progress ?? 0),
          completed: Boolean(quest.completed),
          createdAt: quest.date ?? quest.createdAt ?? new Date().toISOString(),
          completedDate: quest.completedDate,
          recurrencesLeft: (quest as any).recurrencesLeft,
        }),
      );

      setQuests(mapped);
      console.log('[Frontend] Mapped Quests:', mapped);
    } catch {
      addToast("Quest sync failed", "Unable to load quest log.", "error");
    }
  }, [addToast]);

  const fetchQuestLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("/api/quest/log", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuestLogs(response.data?.questLogs ?? []);
      console.log('[Frontend] Quest Logs:', response.data?.questLogs);
    } catch {
      console.error("Failed to fetch quest logs");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await checkAndResetQuests();
      void fetchQuests();
      void fetchQuestLogs();
    };
    void init();
  }, [checkAndResetQuests, fetchQuests, fetchQuestLogs]);

  const handleCreateQuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!goal.trim()) {
      addToast("Missing goal", "Enter a goal before creating a quest.", "error");
      return;
    }

    setBusy(true);

    try {
      const token = localStorage.getItem("token");
      const payload = { 
            goal: goal.trim(), 
            duration,
            recurrences: recurrences ? parseInt(recurrences) : undefined
      };
      console.log('[Frontend] Creating Quest Payload:', payload);

      const response = await axios.post(
        "/api/quest/create",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const quest = response.data?.quest;
      const createdQuest: Quest = {
        id: quest._id,
        goal: quest.goal,
        duration: quest.duration,
        progress: Number(quest.progress ?? 0),
        completed: Boolean(quest.completed),
        createdAt: quest.date ?? new Date().toISOString(),
        recurrencesLeft: quest.recurrencesLeft,
      };

      setQuests((current) => [createdQuest, ...current]);
      setGoal("");
      setDuration("daily");
      setRecurrences("");
      addToast("Quest created", "Your quest is now active.");
    } catch {
      addToast("Create failed", "Could not create quest.", "error");
    } finally {
      setBusy(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);

    // Optimistic update
    const previousQuests = [...quests];
    setQuests((current) => current.filter((q) => q.id !== id));

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/quest/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast("Quest deleted", "The quest has been removed.");
      // Refresh quest logs to show the deleted quest
      void fetchQuestLogs();
    } catch {
      // Revert on failure
      setQuests(previousQuests);
      addToast("Delete failed", "Could not delete quest.", "error");
    }
  };

  const updateQuestState = (id: string, progress: number, completed: boolean) => {
    setQuests((current) =>
      current.map((quest) => {
        if (quest.id !== id) return quest;

        if (completed && !quest.completed) {
          const reward = getDurationMeta(quest.duration).reward;
          addToast("Quest completed", `Achievement unlocked. +${reward} XP.`);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#8B5CF6", "#34D399", "#FBBF24"],
          });
        }

        return {
          ...quest,
          progress,
          completed,
          completedDate: completed ? new Date().toISOString() : quest.completedDate,
        };
      }),
    );
  };

  const updateProgress = async (id: string, nextProgress: number) => {
    try {
      const token = localStorage.getItem("token");
      const normalizedProgress = clamp(nextProgress, 0, 100);

      const response = await axios.put(
        `/api/quest/progress/${id}`,
        { progress: normalizedProgress },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedQuest = response.data?.quest;
      updateQuestState(id, Number(updatedQuest?.progress ?? normalizedProgress), Boolean(updatedQuest?.completed));
    } catch {
      addToast("Update failed", "Could not update quest progress.", "error");
    }
  };

  const toggleCompletion = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `/api/quest/complete/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const responseData = response.data;
      
      // Handle case where quest was deleted (e.g., one-time quest with recurrencesLeft=1)
      if (responseData?.deleted) {
        // Quest was completed and deleted - remove it from the list
        setQuests((current) => current.filter((q) => q.id !== id));
        const reward = getDurationMeta(quests.find(q => q.id === id)?.duration || 'daily').reward;
        addToast("Quest completed", `Achievement unlocked. +${reward} XP.`);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#8B5CF6", "#34D399", "#FBBF24"],
        });
        void fetchQuestLogs();
        return;
      }

      const updatedQuest = responseData?.quest;
      updateQuestState(id, Number(updatedQuest?.progress ?? 0), Boolean(updatedQuest?.completed));
      // Refresh quest logs to show the newly completed quest
      void fetchQuestLogs();
    } catch {
      addToast("Completion failed", "Could not update quest completion.", "error");
    }
  };

  return (
    <>
    <div className="mx-auto w-full max-w-5xl animate-fade-in space-y-8 pb-10 text-text-primary">
      <header className="text-center md:text-left flex items-center gap-3">
        <div className="p-2 rounded bg-accent-primary/10 text-accent-primary">
           <Target className="h-6 w-6" />
        </div>
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-white">Quest Log</h1>
           <p className="text-sm text-text-secondary">Track your active missions and achievements.</p>
        </div>
      </header>

      {/* Top Stats Section */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-discord p-4 bg-bg-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent-primary/10 p-2.5 text-accent-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Active</p>
              <p className="text-xl font-bold text-white">{activeQuests.length}</p>
            </div>
          </div>
        </article>

        <article className="card-discord p-4 bg-bg-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-status-success/10 p-2.5 text-status-success">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Completed</p>
              <p className="text-xl font-bold text-white">{quests.filter(q => q.completed).length}</p>
            </div>
          </div>
        </article>

        <article className="card-discord p-4 bg-bg-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-status-warning/10 p-2.5 text-status-warning">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">XP Gained</p>
              <p className="text-xl font-bold text-white">
                {totalXPGained}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            Active Quests
          </h2>

          <div className="space-y-4">
            {activeQuests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center card-discord bg-bg-card">
                <div className="mb-4 rounded-full bg-bg-base p-4 text-text-muted">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">No active quests</h3>
                <p className="mt-1 max-w-sm text-sm text-text-secondary">
                  Initialize a new directive to begin your journey.
                </p>
              </div>
            ) : (
              activeQuests.map((quest) => {
                const meta = getDurationMeta(quest.duration);
                return (
                  <article
                    key={quest.id}
                    className="group relative overflow-hidden rounded-xl border border-border bg-bg-card p-5 shadow-sm transition-all hover:border-accent-primary/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass}`}>
                            {meta.icon}
                            {meta.label}
                          </span>
                          <span className="text-xs font-bold text-text-muted">+{meta.reward} XP</span>
                          {quest.recurrencesLeft !== undefined && quest.recurrencesLeft !== null && (
                             <span className="ml-2 text-[10px] font-bold text-accent-primary">
                               {quest.recurrencesLeft} Left
                             </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-text-primary group-hover:text-white transition-colors">{quest.goal}</h3>
                      </div>
                      <span className="text-xs font-medium text-text-muted">
                        {new Date(quest.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-5 space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-text-secondary">
                        <span>Progress</span>
                        <span>{quest.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-base">
                        <div
                          className={`h-full rounded-full bg-linear-to-r ${meta.progressClass} transition-all duration-300`}
                          style={{ width: `${quest.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => updateProgress(quest.id, quest.progress + 10)}
                          className="rounded-md bg-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-accent-primary/20 hover:text-accent-hover"
                        >
                          +10%
                        </button>
                        <button
                          type="button"
                          onClick={() => updateProgress(quest.id, quest.progress + 25)}
                          className="rounded-md bg-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-accent-primary/20 hover:text-accent-hover"
                        >
                          +25%
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCompletion(quest.id)}
                        className="btn-discord-primary px-4 py-1.5 text-xs mt-2"
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Complete
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="space-y-6 pt-8 border-t border-border">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            Completed Quests
          </h2>
          <div className="space-y-4">
             {quests.filter(q => q.completed).length === 0 ? (
                <p className="text-sm text-text-muted">No quests completed yet.</p>
             ) : (
                quests.filter(q => q.completed).sort((a, b) => new Date(b.completedDate || 0).getTime() - new Date(a.completedDate || 0).getTime()).map(quest => {
                   const meta = getDurationMeta(quest.duration);
                   return (
                    <article key={quest.id} className="group relative overflow-hidden rounded-xl border border-border/50 bg-bg-card/50 p-4 opacity-75 grayscale-[0.3] hover:grayscale-0 hover:opacity-100 transition-all">
                       <button
                          onClick={(e) => {
                             e.stopPropagation();
                             setDeleteId(quest.id);
                          }}
                          className="absolute top-2 right-2 z-20 rounded-lg p-1.5 text-text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                          title="Delete Quest"
                       >
                          <Trash2 className="h-3.5 w-3.5" />
                       </button>
                       <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-success/10 text-status-success">
                                <Check className="h-4 w-4" />
                             </div>
                             <div>
                                <h3 className="font-bold text-text-primary line-through decoration-text-muted/50">{quest.goal}</h3>
                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                   <span>{meta.label}</span>
                                   <span>•</span>
                                   <span>Completed {new Date(quest.completedDate!).toLocaleDateString()}</span>
                                   <span>•</span>
                                   <span className="text-accent-primary">
                                      {quest.recurrencesLeft === undefined || quest.recurrencesLeft === null
                                        ? "Infinite Loop" 
                                        : quest.recurrencesLeft === 0 
                                            ? "Final Cycle" 
                                            : `${quest.recurrencesLeft} Repeats Left`}
                                   </span>
                                </div>
                             </div>
                          </div>
                      </div>
                    </article>
                   );
                })
             )}
          </div>
        </div>
      </div>

      <div className="space-y-8">
          {/* Create Quest Section */}
          <section className="rounded-xl border border-border bg-bg-panel p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-secondary">
              <Plus className="h-4 w-4" />
              New Directive
            </h2>

            <form onSubmit={handleCreateQuest} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="duration" className="mb-1.5 block text-xs font-semibold text-text-secondary">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      id="duration"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      className="input-discord appearance-none bg-bg-base"
                    >
                      {Object.entries(durationMeta).map(([key, meta]) => (
                        <option key={key} value={key}>
                          {meta.label} (+{meta.reward} XP)
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                
                <div className="w-1/3">
                   <label htmlFor="recurrences" className="mb-1.5 block text-xs font-semibold text-text-secondary">
                    Repeats
                  </label>
                  <input
                    id="recurrences"
                    type="number"
                    min="1"
                    value={recurrences}
                    onChange={(e) => setRecurrences(e.target.value)}
                    placeholder="8"
                    className="input-discord placeholder:text-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="goal" className="mb-1.5 block text-xs font-semibold text-text-secondary">
                  Objective
                </label>
                <input
                  id="goal"
                  type="text"
                  value={goal}
                  maxLength={60}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Define your goal..."
                  className="input-discord placeholder:text-text-muted"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn-discord-primary w-full justify-center text-sm"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Quest"}
              </button>
            </form>
          </section>

          {/* Completed Quests Section */}
          <section className="card-discord p-5 bg-bg-card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-secondary">
              <Trophy className="h-4 w-4 text-status-warning" />
              Completed Logs
            </h2>

            {completedQuestsStacked.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-xs text-text-muted">No completed quests logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedQuestsStacked.slice(0, 5).map((group, index) => {
                  const meta = getDurationMeta(group.duration);
                  return (
                    <div
                      key={index}
                      className="group flex items-center gap-3 rounded-lg bg-bg-base p-3 border border-border transition-colors hover:border-status-success/30"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-status-success/10 text-status-success">
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          <span className="capitalize">{group.goal}</span>
                          {group.count > 1 && <span className="ml-2 text-xs text-text-muted">(x{group.count})</span>}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-status-success">+{group.totalReward}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </section>
    </div>

      {/* Modern Toasts */}
      <div className="fixed bottom-6 right-6 z-2200 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "animate-fade-in flex min-w-75 items-start gap-3 rounded-lg border bg-bg-card p-4 shadow-lg",
              toast.tone === "success" ? "border-status-success/30" : "border-status-error/30",
            ].join(" ")}
          >
            <div
              className={`mt-0.5 rounded p-0.5 ${
                toast.tone === "success" ? "bg-status-success/10 text-status-success" : "bg-status-error/10 text-status-error"
              }`}
            >
              {toast.tone === "success" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{toast.title}</p>
              <p className="text-xs font-medium text-text-secondary">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-2500 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-panel p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            
            <h3 className="mb-2 text-center text-lg font-bold text-white">Delete Quest?</h3>
            <p className="mb-6 text-center text-sm text-text-secondary">
              Are you sure you want to delete this quest? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg bg-border px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#374151]"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
