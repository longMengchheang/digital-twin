"use client";

import { useEffect, useMemo, useState } from "react";
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
    badgeClass: "border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]",
    progressClass: "from-[#8B5CF6] to-[#A78BFA]",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  weekly: {
    label: "Weekly",
    reward: 50,
    badgeClass: "border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]",
    progressClass: "from-[#34D399] to-[#6EE7B7]",
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
    badgeClass: "border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24]",
    progressClass: "from-[#FBBF24] to-[#FCD34D]",
    icon: <Trophy className="h-3.5 w-3.5" />,
  },
};

export default function QuestLogPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("daily");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    void fetchQuests();
  }, []);

  const activeQuests = useMemo(() => quests.filter((quest) => !quest.completed), [quests]);
  const completedQuests = useMemo(() => quests.filter((quest) => quest.completed), [quests]);

  const addToast = (title: string, message: string, tone: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const getDurationMeta = (durationKey: string) => {
    return durationMeta[durationKey.toLowerCase()] ?? durationMeta.daily;
  };

  const fetchQuests = async () => {
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
        }),
      );

      setQuests(mapped);
    } catch {
      addToast("Quest sync failed", "Unable to load quest log.", "error");
    }
  };

  const handleCreateQuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!goal.trim()) {
      addToast("Missing goal", "Enter a goal before creating a quest.", "error");
      return;
    }

    setBusy(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/quest/create",
        { goal: goal.trim(), duration },
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
      };

      setQuests((current) => [createdQuest, ...current]);
      setGoal("");
      setDuration("daily");
      addToast("Quest created", "Your quest is now active.");
    } catch {
      addToast("Create failed", "Could not create quest.", "error");
    } finally {
      setBusy(false);
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

      const updatedQuest = response.data?.quest;
      updateQuestState(id, Number(updatedQuest?.progress ?? 0), Boolean(updatedQuest?.completed));
    } catch {
      addToast("Completion failed", "Could not update quest completion.", "error");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in space-y-8 pb-10 text-[#E5E7EB]">
      <header className="text-center md:text-left flex items-center gap-3">
        <div className="p-2 rounded bg-[#8B5CF6]/10 text-[#8B5CF6]">
           <Target className="h-6 w-6" />
        </div>
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-white">Quest Log</h1>
           <p className="text-sm text-[#9CA3AF]">Track your active missions and achievements.</p>
        </div>
      </header>

      {/* Top Stats Section */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-discord p-4 bg-[#1C1F2B]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#8B5CF6]/10 p-2.5 text-[#8B5CF6]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">Active</p>
              <p className="text-xl font-bold text-white">{activeQuests.length}</p>
            </div>
          </div>
        </article>

        <article className="card-discord p-4 bg-[#1C1F2B]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#34D399]/10 p-2.5 text-[#34D399]">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">Completed</p>
              <p className="text-xl font-bold text-white">{completedQuests.length}</p>
            </div>
          </div>
        </article>

        <article className="card-discord p-4 bg-[#1C1F2B]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#FBBF24]/10 p-2.5 text-[#FBBF24]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">XP Gained</p>
              <p className="text-xl font-bold text-white">
                {completedQuests.reduce((total, quest) => total + getDurationMeta(quest.duration).reward, 0)}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#E5E7EB]">
            Active Quests
          </h2>

          <div className="space-y-4">
            {activeQuests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center card-discord bg-[#1C1F2B]">
                <div className="mb-4 rounded-full bg-[#0F111A] p-4 text-[#6B7280]">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-[#E5E7EB]">No active quests</h3>
                <p className="mt-1 max-w-sm text-sm text-[#9CA3AF]">
                  Initialize a new directive to begin your journey.
                </p>
              </div>
            ) : (
              activeQuests.map((quest) => {
                const meta = getDurationMeta(quest.duration);
                return (
                  <article
                    key={quest.id}
                    className="group relative overflow-hidden rounded-xl border border-[#2A2E3F] bg-[#1C1F2B] p-5 shadow-sm transition-all hover:border-[#8B5CF6]/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass}`}>
                            {meta.icon}
                            {meta.label}
                          </span>
                          <span className="text-xs font-bold text-[#6B7280]">+{meta.reward} XP</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#E5E7EB] group-hover:text-white transition-colors">{quest.goal}</h3>
                      </div>
                      <span className="text-xs font-medium text-[#6B7280]">
                        {new Date(quest.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-5 space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-[#9CA3AF]">
                        <span>Progress</span>
                        <span>{quest.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0F111A]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${meta.progressClass} transition-all duration-300`}
                          style={{ width: `${quest.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#2A2E3F]">
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => updateProgress(quest.id, quest.progress + 10)}
                          className="rounded-md bg-[#2A2E3F] px-3 py-1.5 text-xs font-semibold text-[#9CA3AF] transition-colors hover:bg-[#8B5CF6]/20 hover:text-[#A78BFA]"
                        >
                          +10%
                        </button>
                        <button
                          type="button"
                          onClick={() => updateProgress(quest.id, quest.progress + 25)}
                          className="rounded-md bg-[#2A2E3F] px-3 py-1.5 text-xs font-semibold text-[#9CA3AF] transition-colors hover:bg-[#8B5CF6]/20 hover:text-[#A78BFA]"
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
        </div>

        <div className="space-y-8">
          {/* Create Quest Section */}
          <section className="rounded-xl border border-[#2A2E3F] bg-[#151823] p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
              <Plus className="h-4 w-4" />
              New Directive
            </h2>

            <form onSubmit={handleCreateQuest} className="space-y-4">
              <div>
                <label htmlFor="duration" className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                  Type
                </label>
                <div className="relative">
                  <select
                    id="duration"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="input-discord appearance-none bg-[#0F111A]"
                  >
                    {Object.entries(durationMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label} (+{meta.reward} XP)
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="goal" className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                  Objective
                </label>
                <input
                  id="goal"
                  type="text"
                  value={goal}
                  maxLength={60}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Define your goal..."
                  className="input-discord placeholder:text-[#6B7280]"
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
          <section className="card-discord p-5 bg-[#1C1F2B]">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
              <Trophy className="h-4 w-4 text-[#FBBF24]" />
              Completed Logs
            </h2>

            {completedQuests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#2A2E3F] p-6 text-center">
                <p className="text-xs text-[#6B7280]">No completed quests logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedQuests.slice(0, 5).map((quest) => {
                  const meta = getDurationMeta(quest.duration);
                  return (
                    <div
                      key={quest.id}
                      className="group flex items-center gap-3 rounded-lg bg-[#0F111A] p-3 border border-[#2A2E3F] transition-colors hover:border-[#34D399]/30"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-[#34D399]/10 text-[#34D399]">
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#E5E7EB]">{quest.goal}</p>
                      </div>
                      <span className="text-xs font-bold text-[#34D399]">+{meta.reward}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>

      {/* Modern Toasts */}
      <div className="fixed bottom-6 right-6 z-[2200] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "animate-fade-in flex min-w-[300px] items-start gap-3 rounded-lg border bg-[#1C1F2B] p-4 shadow-lg",
              toast.tone === "success" ? "border-[#34D399]/30" : "border-[#F87171]/30",
            ].join(" ")}
          >
            <div
              className={`mt-0.5 rounded p-0.5 ${
                toast.tone === "success" ? "bg-[#34D399]/10 text-[#34D399]" : "bg-[#F87171]/10 text-[#F87171]"
              }`}
            >
              {toast.tone === "success" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-bold text-[#E5E7EB]">{toast.title}</p>
              <p className="text-xs font-medium text-[#9CA3AF]">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
