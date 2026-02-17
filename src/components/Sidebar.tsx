"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clamp } from "@/lib/math";
import GeminiMark from "@/components/GeminiMark";
import {
  LogOut,
  Network,
  ScrollText,
  Sparkles,
  Swords,
  User,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavItemProps extends NavItem {
  active: boolean;
}

interface ProgressState {
  level: number;
  currentXP: number;
  requiredXP: number;
}

const DEFAULT_PROGRESS: ProgressState = {
  level: 1,
  currentXP: 0,
  requiredXP: 100,
};

function SidebarNavItem({ href, label, icon, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.95rem] font-medium transition-all duration-200",
        active
          ? "bg-accent-primary/10 text-white" 
          : "text-text-secondary hover:bg-bg-card hover:text-text-primary",
      ].join(" ")}
    >
      <span className={active ? "text-accent-primary" : "text-text-secondary group-hover:text-text-primary"}>
        {icon}
      </span>
      <span>{label}</span>
      {active && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-primary" />
      )}
    </Link>
  );
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/dashboard/insight") {
    return pathname === "/dashboard/insight" || pathname === "/dashboard/checkin";
  }
  return pathname === itemHref;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchProgress = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (active) setLoadingProgress(false);
        return;
      }

      try {
        const response = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) setLoadingProgress(false);
          return;
        }

        const data = await response.json();
        const profile = data?.profile;

        if (!active || !profile) {
          return;
        }

        const nextProgress: ProgressState = {
          level: Math.max(1, Math.floor(parseNumber(profile.level, DEFAULT_PROGRESS.level))),
          currentXP: Math.max(0, Math.floor(parseNumber(profile.currentXP, DEFAULT_PROGRESS.currentXP))),
          requiredXP: Math.max(100, Math.floor(parseNumber(profile.requiredXP, DEFAULT_PROGRESS.requiredXP))),
        };

        setProgress(nextProgress);
      } catch {
        // Keep current values on fetch failure.
      } finally {
        if (active) {
          setLoadingProgress(false);
        }
      }
    };

    setLoadingProgress(true);
    void fetchProgress();

    return () => {
      active = false;
    };
  }, [pathname]);

  const progressPercent = useMemo(() => {
    if (!progress.requiredXP) return 0;
    return clamp(Math.round((progress.currentXP / progress.requiredXP) * 100), 0, 100);
  }, [progress.currentXP, progress.requiredXP]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    router.replace("/?mode=signin");
  };

  const navItems: NavItem[] = [
    {
      href: "/dashboard/insight",
      label: "Log",
      icon: <ScrollText className="h-5 w-5" />,
    },
    {
      href: "/dashboard/quest",
      label: "Quest",
      icon: <Swords className="h-5 w-5" />,
    },
    {
      href: "/dashboard/graph",
      label: "Graph",
      icon: <Network className="h-5 w-5" />,
    },
    {
      href: "/dashboard/chat",
      label: "Companion",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  return (
    <aside
      className={[
        "fixed z-1000 flex h-screen flex-col",
        "bg-bg-sidebar",
        "w-(--sidebar-width)",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex h-14 items-center px-4 border-b border-bg-panel">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary text-white shadow-sm">
            <GeminiMark className="text-lg" />
          </div>
          <span className="text-[0.95rem] font-bold text-text-primary">Digital Twin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-4">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isNavItemActive(item.href, pathname)}
          />
        ))}
      </nav>

      {/* User Widget */}
      <div className="bg-[#080a0f] p-3 border-t border-bg-panel">
        <div className="flex items-center gap-3">
           <div className="relative">
              <div className="h-9 w-9 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 p-px shadow-[0_0_10px_rgba(139,92,246,0.28)]">
                 <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1a1d29]">
                   <User className="h-4.5 w-4.5 text-white" strokeWidth={2} />
                 </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-status-success rounded-full border-2 border-bg-sidebar" />
           </div>
           
           <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                 <p className="text-sm font-semibold text-white truncate">Unit Lvl {progress.level}</p>
                 <span className="text-xs text-accent-primary font-medium">{progress.currentXP} XP</span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-bg-card rounded-full overflow-hidden">
                 <div
                    className="h-full bg-accent-primary rounded-full"
                    style={{ width: `${progressPercent}%` }}
                 />
              </div>
           </div>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-border hover:text-white transition-colors"
          type="button"
        >
          <LogOut className="h-3 w-3" />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
}
