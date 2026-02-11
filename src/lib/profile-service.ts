import { computeDailyStreak, deriveBadges, getMoodFromCheckIn } from '@/lib/progression';
import CheckIn from '@/lib/models/CheckIn';
import Quest from '@/lib/models/Quest';
import User from '@/lib/models/User';
import { formatJoinDate } from '@/lib/date';

export async function buildProfile(userId: string, userObj?: Record<string, any>) {
  let user = userObj;

  if (!user) {
    user = await User.findById(userId).lean();
  }

  if (!user) {
    return null;
  }

  const [totalQuests, completedQuests, checkIns, weekendQuestCount, lateNightCheckInCount] = await Promise.all([
    Quest.countDocuments({ userId }),
    Quest.countDocuments({ userId, completed: true }),
    CheckIn.find({ userId }).sort({ date: -1 }).limit(180).lean(),
    Quest.countDocuments({
      userId,
      completed: true,
      $expr: {
        $in: [{ $dayOfWeek: "$completedDate" }, [1, 7]]
      }
    }),
    CheckIn.countDocuments({
      userId,
      $expr: {
        $or: [
          { $gte: [{ $hour: "$date" }, 23] },
          { $lt: [{ $hour: "$date" }, 4] }
        ]
      }
    })
  ]);

  const streak = computeDailyStreak(checkIns.map((entry) => new Date(entry.date)));
  const hasEarlyCheckIn = checkIns.some((entry) => new Date(entry.date).getHours() < 8);

  const badges = deriveBadges({
    totalQuests,
    completedQuests,
    checkInCount: checkIns.length,
    streak,
    level: user.level,
    hasEarlyCheckIn,
    existingBadges: user.badges,
    weekendQuestCount,
    lateNightCheckInCount,
  });

  if (JSON.stringify(badges) !== JSON.stringify(user.badges || [])) {
    await User.findByIdAndUpdate(userId, { $set: { badges } });
  }

  const latestCheckIn = checkIns[0];
  const mood = latestCheckIn
    ? getMoodFromCheckIn(latestCheckIn.overallScore, latestCheckIn.ratings.length * 5)
    : { emoji: '🙂', label: 'Stable' };

  return {
    id: String(user._id),
    name: user.name,
    age: user.age,
    email: user.email,
    location: user.location,
    bio: user.bio,
    level: user.level,
    currentXP: user.currentXP,
    requiredXP: user.requiredXP,
    dailyStreak: streak,
    totalQuests,
    completedQuests,
    badges,
    avatarStage: user.avatarStage,
    joinDate: formatJoinDate(user.joinDate),
    currentMood: mood,
  };
}
