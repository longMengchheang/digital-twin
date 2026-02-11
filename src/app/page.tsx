"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Lightbulb, MessageCircle, Target, User, Zap, Activity } from "lucide-react";
import { validatePassword } from "@/lib/validation";

type FlashType = "success" | "error";

type AuthMode = "signin" | "signup";

interface FlashState {
  type: FlashType;
  text: string;
}

function resolveMode(value: string | null): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<FlashState | null>(null);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLogin = mode === "signin";

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    setMode(resolveMode(params.get("mode")));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let active = true;

    void axios
      .get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        if (active) {
          router.replace("/dashboard/checkin");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const pageTitle = useMemo(() => {
    return isLogin ? "Access Terminal" : "Initialize Unit";
  }, [isLogin]);

  const setAuthMode = (nextMode: AuthMode) => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    setMode(nextMode);
    setFlash(null);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setFlash({ type: "error", text: "Credentials required." });
      return;
    }

    if (!isLogin) {
      const passwordValidation = validatePassword(password.trim());
      if (!passwordValidation.isValid) {
        setFlash({ type: "error", text: passwordValidation.message });
        return;
      }
    }

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    setLoading(true);
    setFlash(null);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await axios.post(endpoint, {
        email: email.trim(),
        password: password.trim(),
      });

      const token = String(response.data?.token || "").trim();
      if (!token) {
        setFlash({ type: "error", text: "Authentication failed. Retry." });
        return;
      }

      localStorage.setItem("token", token);

      if (isLogin) {
        router.replace("/dashboard/checkin");
        return;
      }

      setFlash({ type: "success", text: "Unit Initialized. Loading system..." });
      redirectTimerRef.current = setTimeout(() => {
        router.replace("/dashboard/checkin");
      }, 700);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.msg
          ? String(error.response.data.msg)
          : isLogin
            ? "Access denied. Check credentials."
            : "Initialization failed. Retry.";
      setFlash({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 md:px-8 md:py-10 bg-[#0F111A]">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[1.2rem] border border-[#2A2E3F] bg-[#1C1F2B] shadow-[0_0_50px_-10px_rgba(139,92,246,0.15)] md:grid-cols-[1.1fr_1fr]">
        
        {/* Left Panel: Branding / System Intro */}
        <aside className="relative flex flex-col justify-between border-b border-[#2A2E3F] bg-gradient-to-br from-[#14182E] to-[#0F111A] p-8 md:border-b-0 md:border-r md:p-12">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.1),transparent_50%)]" />
          
          <div className="relative z-10">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-wide">Digital Mind</p>
                <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">System Version 2.0</p>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl leading-tight">
              Initialize your <span className="text-[#8B5CF6]">digital twin</span>.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#9CA3AF]">
              Connect to your personal system. Track quests, monitor stability, and evolve your digital identity.
            </p>
          </div>

          <div className="relative z-10 mt-12 space-y-3">
            {[
              { label: "Daily Log", icon: <FileText className="h-4 w-4" /> },
              { label: "Quest Log", icon: <Target className="h-4 w-4" /> },
              { label: "Insight", icon: <Lightbulb className="h-4 w-4" /> },
              { label: "Companion", icon: <MessageCircle className="h-4 w-4" /> },
            ].map((item) => (
              <div
                key={item.label}
                className="group flex items-center gap-3 rounded-lg border border-[#2A2E3F] bg-[#151823]/50 px-4 py-3 text-sm text-[#E5E7EB] transition-all hover:bg-[#1C1F2B] hover:border-[#8B5CF6]/50"
              >
                <span className="text-[#8B5CF6] transition-transform group-hover:scale-110">{item.icon}</span>
                <span className="font-medium tracking-wide">{item.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Panel: Auth Form */}
        <section className="relative flex flex-col justify-center p-8 md:p-12 bg-[#1C1F2B]">
          <div className="mb-8 flex rounded-lg border border-[#2A2E3F] bg-[#151823] p-1 text-xs font-bold uppercase tracking-wide">
            <button
              type="button"
              className={[
                "w-1/2 rounded px-3 py-2 transition-all duration-200",
                isLogin ? "bg-[#2A2E3F] text-white shadow-sm" : "text-[#6B7280] hover:text-[#9CA3AF]",
              ].join(" ")}
              onClick={() => setAuthMode("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={[
                "w-1/2 rounded px-3 py-2 transition-all duration-200",
                !isLogin ? "bg-[#2A2E3F] text-white shadow-sm" : "text-[#6B7280] hover:text-[#9CA3AF]",
              ].join(" ")}
              onClick={() => setAuthMode("signup")}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{pageTitle}</h2>
          <p className="text-sm text-[#9CA3AF]">Explore your thoughts.</p>
          <p className="text-sm text-[#9CA3AF] mb-8">
            {isLogin ? "Enter your credentials to access the system." : "Create a new biological profile."}
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@system.com"
                autoComplete="email"
                className="input-discord w-full bg-[#151823] border-[#2A2E3F] focus:border-[#8B5CF6] transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="input-discord w-full bg-[#151823] border-[#2A2E3F] focus:border-[#8B5CF6] transition-colors"
                required
              />
            </div>
            
            {isLogin && (
              <div className="flex justify-end">
                <a href="/auth/forgot-password" className="text-xs font-medium text-[#8B5CF6] hover:text-[#A78BFA] transition-colors">
                  Forgot password?
                </a>
              </div>
            )}


            {flash && (
              <div
                className={[
                  "rounded-lg border px-4 py-3 text-sm flex items-center gap-2",
                  flash.type === "success"
                    ? "border-green-500/20 bg-green-500/10 text-green-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400",
                ].join(" ")}
              >
                {flash.type === "error" && <Activity className="h-4 w-4" />}
                {flash.text}
              </div>
            )}

            <button className="btn-discord-primary w-full group relative overflow-hidden" disabled={loading} type="submit">
               <span className="relative z-10 flex items-center justify-center gap-2">
                 {loading ? "Processing..." : isLogin ? "Access System" : "Initialize"}
                 {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
               </span>
            </button>
          </form>

        </section>
      </div>
    </div>
  );
}
