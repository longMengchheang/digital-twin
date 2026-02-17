"use client";

import { useState, Suspense } from "react";
import axios from "axios";
import { ArrowRight, Key, Activity } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { validatePassword } from "@/lib/validation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setMessage({ type: "error", text: "Invalid code format." });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setMessage({ type: "error", text: validation.message });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post("/api/auth/reset-password", {
        email: emailParam,
        otp,
        newPassword: password,
      });

      setMessage({ type: "success", text: res.data.msg || "Credentials updated. Redirecting..." });
      
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response?.data?.msg
        ? String(error.response.data.msg)
        : "Update failed. Code may be invalid/expired.";
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
            <Key className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">Reset Credentials</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Enter the 6-digit code sent to <strong className="text-white">{emailParam}</strong> and your new password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-1">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input-discord w-full bg-bg-panel border-border focus:border-accent-primary text-center text-lg tracking-[0.5em] transition-colors"
                placeholder="000000"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-1">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-discord w-full bg-bg-panel border-border focus:border-accent-primary transition-colors"
                placeholder="New password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-discord w-full bg-bg-panel border-border focus:border-accent-primary transition-colors"
                placeholder="Confirm new password"
              />
            </div>
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
            {loading ? "Updating..." : "Update Credentials"}
            {!loading && <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>
         <div className="text-center">
            <Link href="/auth/forgot-password" className="text-sm font-medium text-accent-primary hover:text-accent-hover transition-colors">
              Resend Code
            </Link>
          </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-bg-base text-accent-primary">Loading System...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
