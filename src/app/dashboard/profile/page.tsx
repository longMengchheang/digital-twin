"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2, Edit2, X } from "lucide-react";
import { ProfilePage, UserProfile } from "@/components/profile";

interface MoodState {
  emoji: string;
  label: string;
}

interface LocalUserProfile {
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

export default function CharacterPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalUserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<LocalUserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchProfile = useCallback(async () => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("/api/profile", { headers });
      const incoming = response.data?.profile as LocalUserProfile | undefined;

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
  }, [authHeaders, router]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

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

      const updatedProfile = response.data?.profile as LocalUserProfile | undefined;
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
        <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-panel px-4 py-2 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin text-accent-primary" />
          Initializing Identity Core...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3 text-sm text-status-error">
        {error || "Identity data unavailable."}
      </div>
    );
  }

  // Transform profile data for the new components
  const profileData: UserProfile = {
    id: profile.id,
    name: profile.name,
    avatarStage: profile.avatarStage,
    level: profile.level,
    currentXP: profile.currentXP,
    requiredXP: profile.requiredXP,
    dailyStreak: profile.dailyStreak,
    totalQuests: profile.totalQuests,
    completedQuests: profile.completedQuests,
    badges: profile.badges,
    currentMood: profile.currentMood,
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in pb-10 text-text-primary">
      {error && (
        <div className="rounded-xl border border-status-warning/20 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">{error}</div>
      )}

      {/* Use new ProfilePage components */}
      <ProfilePage profile={profileData} />

      {/* Edit Button */}
      <div className="mx-auto max-w-2xl mt-4">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-2200 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-bg-panel p-6 shadow-2xl animate-slide-up">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Update Identity</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded p-1 text-text-muted hover:bg-border hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSave}>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  value={formData.name ?? ""}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="input-discord bg-bg-sidebar"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted" htmlFor="age">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    min={1}
                    value={formData.age ?? 0}
                    onChange={(event) => setFormData({ ...formData, age: Number(event.target.value) })}
                    className="input-discord bg-bg-sidebar"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    value={formData.location ?? ""}
                    onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                    className="input-discord bg-bg-sidebar"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="input-discord bg-bg-sidebar"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted" htmlFor="bio">
                  Bio Protocols
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={formData.bio ?? ""}
                  onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                  className="input-discord bg-bg-sidebar resize-none"
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
