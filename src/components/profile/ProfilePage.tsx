"use client";

import React from "react";
import { ProfileHeader } from "./ProfileHeader";
import { StatsSection } from "./StatsSection";
import { AchievementsSection } from "./AchievementsSection";

export interface UserProfile {
  id: string;
  name: string;
  avatarStage: string;
  level: number;
  currentXP: number;
  requiredXP: number;
}

export interface ProfilePageProps {
  profile: UserProfile;
}

/**
 * ProfilePage - Main container that combines all profile sections
 * Displays the complete profile with only the header as per minimalist layout
 */
export function ProfilePage({ profile }: ProfilePageProps) {
  if (!profile) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      {/* Profile Header - Avatar, Level, XP */}
      <ProfileHeader
        name={profile.name}
        avatarStage={profile.avatarStage}
        level={profile.level}
        currentXP={profile.currentXP}
        requiredXP={profile.requiredXP}
      />

      <div className="grid gap-8 md:grid-cols-5 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
        <div className="md:col-span-2">
          <StatsSection />
        </div>

        <div className="md:col-span-3">
          <AchievementsSection />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
