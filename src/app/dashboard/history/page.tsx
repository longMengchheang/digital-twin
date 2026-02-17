"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

interface HistoryItem {
  id: string;
  date: string;
  overallScore: number;
  percentage: number;
  ratings: number[];
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("/api/checkin/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = Array.isArray(response.data?.history) ? (response.data.history as HistoryItem[]) : [];
      setHistory(items);
      setError("");
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.push("/");
        return;
      }

      setError("Could not load pulse history.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in">
      <section className="card-calm overflow-hidden text-left">
        <header className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Clock className="h-4 w-4 text-blue-600" />
          <h1 className="text-lg font-semibold text-slate-900">Pulse History</h1>
        </header>

        <div className="space-y-3 p-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading history...</p>
          ) : error ? (
            <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">{error}</p>
          ) : !history.length ? (
            <p className="text-sm text-slate-500">No history available yet.</p>
          ) : (
            history.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Date:</span> {new Date(item.date).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  <span className="font-medium">Score:</span> {item.overallScore}/25 ({item.percentage}%)
                </p>
                <p className="mt-1 text-xs text-slate-500">Ratings: {item.ratings.join(", ")}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
