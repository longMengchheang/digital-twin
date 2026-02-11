"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clamp } from "@/lib/math";
import {
  Compass,
  FileText,
  Lightbulb,
  LogOut,
  MessageSquareText,
  User,
  Zap,
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
          ? "bg-[#8B5CF6]/10 text-white" 
          : "text-[#9CA3AF] hover:bg-[#1C1F2B] hover:text-[#E5E7EB]",
      ].join(" ")}
    >
      <span className={active ? "text-[#8B5CF6]" : "text-[#9CA3AF] group-hover:text-[#E5E7EB]"}>
        {icon}
      </span>
      <span>{label}</span>
      {active && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
      )}
    </Link>
  );
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
      href: "/dashboard/checkin",
      label: "Log",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      href: "/dashboard/quest",
      label: "Quests",
      icon: <Compass className="h-5 w-5" />,
    },
    {
      href: "/dashboard/insight",
      label: "Insight",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      href: "/dashboard/chat",
      label: "Companion",
      icon: <MessageSquareText className="h-5 w-5" />,
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
        "fixed z-[1000] flex h-screen flex-col",
        "bg-[#0B0D14]",
        "w-[var(--sidebar-width)]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex h-14 items-center px-4 border-b border-[#151823]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6] text-white shadow-sm">
            <Zap className="h-4 w-4 fill-white" />
          </div>
          <span className="text-[0.95rem] font-bold text-[#E5E7EB]">Digital Twin</span>
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
            active={pathname === item.href}
          />
        ))}
      </nav>

      {/* User Widget */}
      <div className="bg-[#080a0f] p-3 border-t border-[#151823]">
        <div className="flex items-center gap-3">
           <div className="relative">
             <div className="h-9 w-9 bg-[#1C1F2B] rounded-full flex items-center justify-center text-[#9CA3AF] border border-[#2A2E3F]">
                <User className="h-5 w-5" />
             </div>
             <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-[#34D399] rounded-full border-2 border-[#0B0D14]" />
           </div>
           
           <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                 <p className="text-sm font-semibold text-white truncate">Unit Lvl {progress.level}</p>
                 <span className="text-xs text-[#8B5CF6] font-medium">{progress.currentXP} XP</span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-[#1C1F2B] rounded-full overflow-hidden">
                 <div
                    className="h-full bg-[#8B5CF6] rounded-full"
                    style={{ width: `${progressPercent}%` }}
                 />
              </div>
           </div>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-[#1C1F2B] px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:bg-[#2A2E3F] hover:text-white transition-colors"
          type="button"
        >
          <LogOut className="h-3 w-3" />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
}
