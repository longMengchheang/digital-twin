"use client";

import { useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { Activity } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      setMessage({ type: "success", text: res.data.msg || "Link dispatched. Redirecting..." });
      
      // Redirect to reset password page with email
      setTimeout(() => {
        const params = new URLSearchParams();
        params.set("email", email);
        // Use window.location as router.push might be too fast or just strictly go there
        window.location.href = `/auth/reset-password?${params.toString()}`;
      }, 1000);

    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response?.data?.msg
        ? String(error.response.data.msg)
        : "Request failed. Retry.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-bg-card p-8 shadow-[0_0_50px_-10px_rgba(139,92,246,0.1)]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">Account Recovery</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your biological identifier (email) to receive a reset link.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-discord w-full bg-bg-panel border-border focus:border-accent-primary transition-colors"
              placeholder="user@system.com"
            />
          </div>

          {message && (
             <div
                className={[
                  "rounded-lg border px-4 py-3 text-sm flex items-center gap-2",
                  message.type === "success"
                    ? "border-green-500/20 bg-green-500/10 text-green-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400",
                ].join(" ")}
              >
                {message.type === "error" && <Activity className="h-4 w-4" />}
                {message.text}
              </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-discord-primary group relative flex w-full justify-center py-3"
          >
            {loading ? "Transmitting..." : "Send Reset Link"}
            {!loading && <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-accent-primary hover:text-accent-hover transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Access Terminal
          </Link>
        </div>
      </div>
    </div>
  );
}
