"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProfilePage, UserProfile } from "@/components/profile";

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
  avatarStage: string;
  joinDate: string;
}

export default function CharacterPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in pb-10 text-text-primary">
      {error && (
        <div className="rounded-xl border border-status-warning/20 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">{error}</div>
      )}

      {/* Use new ProfilePage components */}
      <ProfilePage profile={profileData} />
    </div>
  );
}
