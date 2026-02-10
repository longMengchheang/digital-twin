import { expect, test, describe } from "bun:test";
import { computeDailyStreak, BadgeContext, deriveBadges } from "./progression";

describe("Progression Logic", () => {
  describe("computeDailyStreak", () => {
    test("calculates streak correctly for consecutive days", () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setDate(today.getDate() - 2);

      const dates = [today, yesterday, dayBefore];
      expect(computeDailyStreak(dates)).toBe(3);
    });

    test("streak breaks if a day is skipped", () => {
      const today = new Date();
      const dayBefore = new Date(today);
      dayBefore.setDate(today.getDate() - 2); // Skipped yesterday

      const dates = [today, dayBefore];
      expect(computeDailyStreak(dates)).toBe(1);
    });

    test("streak is 0 if no dates provided", () => {
      expect(computeDailyStreak([])).toBe(0);
    });

    test("streak should reset if last activity was more than 1 day ago", () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      const dates = [fiveDaysAgo, sixDaysAgo];

      const result = computeDailyStreak(dates);
      expect(result).toBe(0);
    });
  });

  describe("deriveBadges", () => {
    test("awards basic badges", () => {
      const context: BadgeContext = {
        totalQuests: 1,
        completedQuests: 7,
        checkInCount: 10,
        streak: 30,
        level: 10,
        hasEarlyCheckIn: true,
      };

      const badges = deriveBadges(context);
      expect(badges).toContain("First Quest");
      expect(badges).toContain("Week Warrior");
      expect(badges).toContain("Level 10");
      expect(badges).toContain("Streak Master");
      expect(badges).toContain("Mindful");
      expect(badges).toContain("Early Bird");
    });

    test("awards new badges (Weekend Warrior, Night Owl)", () => {
      const context: BadgeContext = {
        totalQuests: 0,
        completedQuests: 0,
        checkInCount: 0,
        streak: 0,
        level: 1,
        hasEarlyCheckIn: false,
        weekendQuestCount: 1,
        lateNightCheckInCount: 1,
      };

      const badges = deriveBadges(context);
      expect(badges).toContain("Weekend Warrior");
      expect(badges).toContain("Night Owl");
    });
  });
});
