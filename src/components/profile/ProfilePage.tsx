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
  dailyStreak: number;
  totalQuests: number;
  completedQuests: number;
  badges: string[];
  currentMood: {
    emoji: string;
    label: string;
  };
}

export interface ProfilePageProps {
  profile: UserProfile;
}

/**
 * ProfilePage - Main container that combines all profile sections
 * Displays the complete profile with header, stats, and achievements
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

      {/* Statistics Section - 2x2 grid */}
      <StatsSection
        dailyStreak={profile.dailyStreak}
        completedQuests={profile.completedQuests}
        totalQuests={profile.totalQuests}
        currentMood={profile.currentMood}
        badgesCount={profile.badges.length}
      />

      {/* Achievements Section - Vertical list */}
      <AchievementsSection badges={profile.badges} />
    </div>
  );
}

export default ProfilePage;
