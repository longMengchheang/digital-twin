import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { normalizeDuration, QUEST_XP_REWARD } from '@/lib/progression';
import { adjustUserXP } from '@/lib/user-progress';

import Quest from '@/lib/models/Quest';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ msg: 'Invalid quest id.' }, { status: 400 });
    }

    const quest = await Quest.findOne({ _id: id, userId: user.id });
    if (!quest) {
      return NextResponse.json({ msg: 'Quest not found.' }, { status: 404 });
    }

    const nextCompleted = !quest.completed;
    quest.completed = nextCompleted;
    quest.progress = nextCompleted ? 100 : 0;
    quest.completedDate = nextCompleted ? new Date() : null;

    const reward = QUEST_XP_REWARD[normalizeDuration(quest.duration)] || 0;
    const [progression] = await Promise.all([
      adjustUserXP(user.id, nextCompleted ? reward : -reward),
      quest.save(),
    ]);

    return NextResponse.json({
      msg: nextCompleted ? 'Quest completed.' : 'Quest reopened.',
      quest,
      progression,
    });
  } catch (error) {
    console.error('Toggle completion error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
