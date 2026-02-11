"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart2, Check, Loader2, Sparkles } from "lucide-react";

interface ResponseEntry {
  question: string;
  rating: number;
}

interface CheckInResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
}

interface MoodOption {
  value: number;
  emoji: string;
  label: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  {
    value: 1,
    emoji: "😞",
    label: "Low",
    color: "bg-[#F87171]",
  },
  {
    value: 2,
    emoji: "😐",
    label: "Neutral",
    color: "bg-[#6B7280]", // Muted gray
  },
  {
    value: 3,
    emoji: "🙂",
    label: "Good",
    color: "bg-[#34D399]", // Teal
  },
  {
    value: 4,
    emoji: "😄",
    label: "Great",
    color: "bg-[#22D3EE]", // Cyan
  },
  {
    value: 5,
    emoji: "🤩",
    label: "Excellent",
    color: "bg-[#8B5CF6]", // Purple
  },
];

const fallbackQuestions = [
  "How has your emotional energy been today?",
  "How focused did you feel on key priorities?",
  "How steady was your stress level today?",
  "How connected did you feel to people around you?",
  "How positive do you feel about tomorrow?",
];

export default function DailyPulsePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchQuestions();
  }, []);

  const completionPercent = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  const fetchQuestions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      const response = await axios.get("/api/checkin/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incomingQuestions = response.data?.questions;
      setQuestions(Array.isArray(incomingQuestions) && incomingQuestions.length ? incomingQuestions : fallbackQuestions);
      setError("");
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 400) {
        setIsAlreadyCompleted(true);
      } else {
        setQuestions(fallbackQuestions);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitCheckIn = async (entries: ResponseEntry[]) => {
    setSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      const ratings = entries.map((entry) => entry.rating);
      const response = await axios.post(
        "/api/checkin/submit",
        { ratings },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const apiResult = response.data?.result as CheckInResult | undefined;
      const computedTotal = ratings.reduce((sum, value) => sum + value, 0);
      const computedMax = ratings.length * 5;
      const computedPercentage = Math.round((computedTotal / computedMax) * 100);

      const finalResult: CheckInResult =
        apiResult && Number.isFinite(apiResult.totalScore)
          ? apiResult
          : {
              totalScore: computedTotal,
              maxScore: computedMax,
              percentage: computedPercentage,
            };

      setResult(finalResult);
      setIsCompleted(true);

      if (finalResult.percentage >= 80) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#8B5CF6", "#34D399", "#FCD34D"],
        });
      }
    } catch {
      setError("Failed to submit daily pulse. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!selectedRating) return;

    const nextResponses = [
      ...responses,
      {
        question: questions[currentQuestionIndex],
        rating: selectedRating,
      },
    ];
    setResponses(nextResponses);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((current) => current + 1);
      setSelectedRating(0);
      return;
    }

    await submitCheckIn(nextResponses);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#9CA3AF]">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
          <p className="text-sm font-medium">Loading system...</p>
        </div>
      </div>
    );
  }

  // Already Completed View
  if (isAlreadyCompleted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="card-discord w-full max-w-md p-8 text-center bg-[#1C1F2B]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-[#E5E7EB]">Check-in Complete</h1>
          <p className="mb-8 text-[#9CA3AF] text-sm">
            Data has been logged for today.
          </p>
          <button
            onClick={() => router.push("/dashboard/insight")}
            className="w-full rounded-md bg-[#2A2E3F] py-3 text-sm font-medium text-[#E5E7EB] hover:bg-[#323648] transition-colors"
          >
            Go to Insight
          </button>
        </div>
      </div>
    );
  }

  // Success View
  if (isCompleted && result) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="card-discord w-full max-w-lg p-8 text-center bg-[#1C1F2B]">
          
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] border-2 border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Check className="h-10 w-10" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-[#E5E7EB]">System Updated</h1>
            <p className="mb-8 text-[#9CA3AF]">Your metrics have been recorded.</p>

            <div className="mb-8 flex justify-center gap-4">
               <div className="rounded bg-[#0F111A] px-5 py-3 border border-[#2A2E3F]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Score</p>
                  <p className="text-xl font-bold text-white">{result.percentage}%</p>
               </div>
               <div className="rounded bg-[#0F111A] px-5 py-3 border border-[#2A2E3F]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Reward</p>
                  <p className="text-xl font-bold text-[#34D399]">+{result.percentage} XP</p>
               </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                 onClick={() => router.push("/dashboard/insight")}
                 className="btn-discord-primary w-full"
              >
                View Insights
              </button>
              <button
                onClick={() => setIsAlreadyCompleted(true)}
                className="w-full rounded-md py-3 text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
        </div>
      </div>
    );
  }

  // Question Flow
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-[#E5E7EB]">
      <div className="mb-8 text-center animate-fade-in">
        <span className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Daily Log</span>
        <h1 className="text-2xl font-bold mt-1">System Check</h1>
      </div>

      <div className="card-discord w-full max-w-2xl p-8 bg-[#1C1F2B] animate-fade-in">
        {error && (
            <div className="mb-6 rounded border border-[#F87171]/20 bg-[#F87171]/10 px-4 py-3 text-sm text-[#F87171]">
                {error}
            </div>
        )}

        {/* Progress */}
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            <span>Query {currentQuestionIndex + 1} / {questions.length}</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0F111A]">
            <div 
                className="h-full rounded-full bg-[#8B5CF6] transition-all duration-300 ease-out"
                style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-10 text-center">
            <h2 className="text-xl font-medium leading-relaxed text-white">
                {questions[currentQuestionIndex]}
            </h2>
        </div>

        {/* Mood Selector */}
        <div className="mb-10 grid grid-cols-5 gap-3">
            {moodOptions.map((mood) => {
                const isSelected = selectedRating === mood.value;
                return (
                    <button
                        key={mood.value}
                        type="button"
                        onClick={() => setSelectedRating(mood.value)}
                        className={`group relative flex flex-col items-center justify-center gap-2 rounded-lg p-3 transition-all duration-200 border ${
                            isSelected 
                                ? `bg-[#2A2E3F] border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.2)]` 
                                : "bg-[#151823] border-[#2A2E3F] hover:bg-[#2A2E3F] hover:border-[#9CA3AF]"
                        }`}
                    >
                        <span className="text-3xl transition-transform duration-200 group-hover:scale-110">
                            {mood.emoji}
                        </span>
                        {isSelected && (
                             <span className="text-[10px] font-bold uppercase tracking-wide text-[#E5E7EB]">
                                {mood.label}
                             </span>
                        )}
                    </button>
                );
            })}
        </div>

        {/* Action Button */}
        <button
            type="button"
            onClick={() => void handleNext()}
            disabled={!selectedRating || submitting}
            className="btn-discord-primary w-full py-3 text-sm font-bold shadow-lg"
        >
            {submitting ? (
                <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                </div>
            ) : currentQuestionIndex < questions.length - 1 ? (
                <div className="flex items-center justify-center gap-2">
                    <span>Next Query</span>
                    <ArrowRight className="h-4 w-4" />
                </div>
            ) : (
                "Complete"
            )}
        </button>
      </div>
    </div>
  );
}
