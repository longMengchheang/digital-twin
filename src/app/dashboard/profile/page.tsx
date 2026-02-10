"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  Calendar,
  Edit2,
  Flame,
  Loader2,
  Mail,
  MapPin,
  Shield,
  Target,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";

interface MoodState {
  emoji: string;
  label: string;
}

interface UserProfile {
  id: string;
  name: string;
  age: number;
  email: string;
  location: string;
  bio: string;
  level: number;
  currentXP: number;
  requiredXP: number;
  dailyStreak: number;
  totalQuests: number;
  completedQuests: number;
  badges: string[];
  avatarStage: string;
  joinDate: string;
  currentMood: MoodState;
}

const badgeIcons: Record<string, string> = {
  "First Quest": "🏁",
  "Week Warrior": "⚔️",
  "Level 10": "🎯",
  "Streak Master": "🔥",
  Mindful: "🧠",
  "Early Bird": "🌅",
  "Weekend Warrior": "🌲",
  "Night Owl": "🦉",
};

export default function CharacterPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchProfile();
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProfile = async () => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("/api/profile", { headers });
      const incoming = response.data?.profile as UserProfile | undefined;

      if (!incoming) {
        setError("Profile data is unavailable.");
        return;
      }

      setProfile(incoming);
      setFormData(incoming);
      setError("");
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.push("/");
        return;
      }

      setError("Failed to load character profile.");
    } finally {
      setLoading(false);
    }
  };

  const xpPercent = useMemo(() => {
    if (!profile?.requiredXP) return 0;
    return Math.round((profile.currentXP / profile.requiredXP) * 100);
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile?.name) return "DT";
    return profile.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await axios.put(
        "/api/profile",
        {
          name: formData.name,
          age: formData.age,
          email: formData.email,
          location: formData.location,
          bio: formData.bio,
          avatarStage: formData.avatarStage,
        },
        { headers },
      );

      const updatedProfile = response.data?.profile as UserProfile | undefined;
      if (updatedProfile) {
        setProfile(updatedProfile);
        setFormData(updatedProfile);
      }

      setIsEditing(false);
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.push("/");
        return;
      }

      const message =
        axios.isAxiosError(requestError) && requestError.response?.data?.msg
          ? String(requestError.response.data.msg)
          : "Failed to save profile.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-[#2A2E3F] bg-[#151823] px-4 py-2 text-sm text-[#9CA3AF]">
          <Loader2 className="h-4 w-4 animate-spin text-[#8B5CF6]" />
          Initializing Identity Core...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-[#F87171]/20 bg-[#F87171]/10 px-4 py-3 text-sm text-[#F87171]">
        {error || "Identity data unavailable."}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in space-y-8 pb-10 text-[#E5E7EB]">
      {error && (
        <div className="rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/10 px-4 py-3 text-sm text-[#FBBF24]">{error}</div>
      )}

      {/* Identity Core (Avatar + Level) */}
      <section className="relative flex flex-col items-center justify-center rounded-xl bg-[#151823] border border-[#2A2E3F] p-8 shadow-lg">
         <div className="absolute top-4 right-4">
            <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded p-2 text-[#6B7280] hover:bg-[#2A2E3F] hover:text-[#E5E7EB] transition-colors"
            title="Edit Identity"
            >
            <Edit2 className="h-4 w-4" />
            </button>
         </div>

         {/* Avatar Ring */}
         <div className="relative mb-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#1C1F2B] border-4 border-[#151823] shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                <span className="text-4xl font-bold text-[#E5E7EB]">{initials}</span>
            </div>
            {/* Level Badge integrated */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 rounded-full border border-[#2A2E3F] bg-[#0B0D14] px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6] shadow-sm whitespace-nowrap">
                <span>Level</span>
                <span>{profile.level}</span>
            </div>
         </div>

         <h1 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
         <p className="text-sm font-medium text-[#9CA3AF] mt-1">{profile.avatarStage}</p>

         {/* System Energy Meter (Level Bar) */}
         <div className="mt-8 w-full max-w-md rounded-xl bg-[#0B0D14] border border-[#2A2E3F] p-4">
             <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                <span>System Energy</span>
                <span>{profile.currentXP} / {profile.requiredXP} XP</span>
             </div>
             <div className="h-2 w-full overflow-hidden rounded-full bg-[#151823]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] shadow-[0_0_10px_rgba(139,92,246,0.4)] transition-all duration-700 ease-out"
                  style={{ width: `${xpPercent}%` }}
                />
             </div>
         </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="card-discord p-5 bg-[#1C1F2B] hover:bg-[#202330] transition-colors">
          <div className="mb-3 inline-flex rounded bg-[#FBBF24]/10 p-2 text-[#FBBF24]">
            <Flame className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-white">{profile.dailyStreak}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Day Streak</p>
        </article>

        <article className="card-discord p-5 bg-[#1C1F2B] hover:bg-[#202330] transition-colors">
          <div className="mb-3 inline-flex rounded bg-[#34D399]/10 p-2 text-[#34D399]">
            <Target className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-white">
            {profile.completedQuests}
            <span className="text-sm font-normal text-[#6B7280] ml-1">/ {profile.totalQuests}</span>
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Quests Done</p>
        </article>

        <article className="card-discord p-5 bg-[#1C1F2B] hover:bg-[#202330] transition-colors">
          <div className="mb-3 inline-flex rounded bg-[#8B5CF6]/10 p-2 text-[#8B5CF6]">
            <Activity className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-white">{profile.currentMood?.emoji || "🙂"}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Current State</p>
        </article>

        <article className="card-discord p-5 bg-[#1C1F2B] hover:bg-[#202330] transition-colors">
          <div className="mb-3 inline-flex rounded bg-[#22D3EE]/10 p-2 text-[#22D3EE]">
            <Trophy className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-white">{profile.badges.length}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Badges</p>
        </article>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Badge Collection */}
        <section className="card-discord p-6 bg-[#1C1F2B]">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
            <Award className="h-4 w-4 text-[#FBBF24]" />
            Collection
          </h2>

          {profile.badges.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 rounded bg-[#0B0D14] border border-[#2A2E3F] px-3 py-2 text-xs font-medium text-[#E5E7EB] transition-colors hover:border-[#FBBF24]/30"
                >
                  <span>{badgeIcons[badge] ?? "🏆"}</span>
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded border border-dashed border-[#2A2E3F] bg-[#0F111A] py-8 text-center">
              <p className="text-xs text-[#6B7280]">Complete quests to earn badges.</p>
            </div>
          )}
        </section>

        {/* Profile Details */}
        <section className="card-discord p-6 bg-[#1C1F2B]">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
            <User className="h-4 w-4 text-[#8B5CF6]" />
            About Unit
          </h2>

          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[#D1D5DB]">{profile.bio || "No bio protocol initialized."}</p>

            <div className="space-y-3 border-t border-[#2A2E3F] pt-4">
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                <Mail className="h-4 w-4 opacity-50" />
                {profile.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                <MapPin className="h-4 w-4 opacity-50" />
                {profile.location || "Unknown Location"}
              </div>
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                <Calendar className="h-4 w-4 opacity-50" />
                Joined {new Date(profile.joinDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-[#2A2E3F] bg-[#151823] p-6 shadow-2xl animate-slide-up">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Update Identity</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded p-1 text-[#6B7280] hover:bg-[#2A2E3F] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSave}>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  value={formData.name ?? ""}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="input-discord bg-[#0B0D14]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="age">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    min={1}
                    value={formData.age ?? 0}
                    onChange={(event) => setFormData({ ...formData, age: Number(event.target.value) })}
                    className="input-discord bg-[#0B0D14]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    value={formData.location ?? ""}
                    onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                    className="input-discord bg-[#0B0D14]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="input-discord bg-[#0B0D14]"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#6B7280]" htmlFor="bio">
                  Bio Protocols
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={formData.bio ?? ""}
                  onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                  className="input-discord bg-[#0B0D14] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-discord-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-discord-primary" disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                       <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                    </span>
                  ) : (
                    "Save Identity"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
