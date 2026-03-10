"use client";

import { ProfileHeader } from "./ProfileHeader";
import { StatsSection } from "./StatsSection";
import { AchievementsSection } from "./AchievementsSection";

export interface ProfileMood {
  emoji: string;
  label: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarStage: string;
  level: number;
  currentXP: number;
  requiredXP: number;
  dailyStreak: number;
  totalQuests: number;
  completedQuests: number;
  badges: string[];
  currentMood?: ProfileMood;
}

export interface ProfilePageProps {
  profile: UserProfile;
}

export function ProfilePage({ profile }: ProfilePageProps) {
  if (!profile) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <ProfileHeader
        name={profile.name}
        avatarStage={profile.avatarStage}
        level={profile.level}
        currentXP={profile.currentXP}
        requiredXP={profile.requiredXP}
      />

      <div
        className="grid gap-8 md:grid-cols-5 animate-fade-in"
        style={{ animationDelay: "150ms", animationFillMode: "both" }}
      >
        <div className="md:col-span-2">
          <StatsSection
            dailyStreak={profile.dailyStreak}
            totalQuests={profile.totalQuests}
            completedQuests={profile.completedQuests}
            currentMood={profile.currentMood}
          />
        </div>

        <div className="md:col-span-3">
          <AchievementsSection badges={profile.badges} />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
