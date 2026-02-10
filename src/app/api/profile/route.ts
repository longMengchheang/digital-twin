import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { computeDailyStreak, deriveBadges, getMoodFromCheckIn } from '@/lib/progression';
import CheckIn from '@/lib/models/CheckIn';
import Quest from '@/lib/models/Quest';
import User from '@/lib/models/User';
import { formatJoinDate } from '@/lib/date';

export const dynamic = 'force-dynamic';

interface ProfileUpdatePayload {
  name?: string;
  age?: number;
  email?: string;
  location?: string;
  bio?: string;
  avatarStage?: string;
}

async function buildProfile(userId: string) {
  const user = await User.findById(userId).lean();
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

export const GET = withAuth(async (req, _context, user) => {
  try {
    await dbConnect();

    const profile = await buildProfile(user.id);
    if (!profile) {
      return NextResponse.json({ msg: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, _context, authUser) => {
  try {
    await dbConnect();

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ msg: 'User not found.' }, { status: 404 });
    }

    const body = (await req.json()) as ProfileUpdatePayload;

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ msg: 'Name cannot be empty.' }, { status: 400 });
      }
      user.name = name.slice(0, 60);
    }

    if (body.age !== undefined) {
      const age = Number(body.age);
      if (!Number.isFinite(age) || age < 1 || age > 120) {
        return NextResponse.json({ msg: 'Age must be between 1 and 120.' }, { status: 400 });
      }
      user.age = Math.floor(age);
    }

    if (typeof body.location === 'string') {
      user.location = body.location.trim().slice(0, 120) || 'Unknown';
    }

    if (typeof body.bio === 'string') {
      user.bio = body.bio.trim().slice(0, 280);
    }

    if (typeof body.avatarStage === 'string') {
      user.avatarStage = body.avatarStage.trim().slice(0, 80) || user.avatarStage;
    }

    if (typeof body.email === 'string') {
      const email = body.email.trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ msg: 'Email cannot be empty.' }, { status: 400 });
      }

      if (email !== user.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return NextResponse.json({ msg: 'Email already in use.' }, { status: 409 });
        }
      }

      user.email = email;
    }

    await user.save();

    const profile = await buildProfile(authUser.id);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
});
