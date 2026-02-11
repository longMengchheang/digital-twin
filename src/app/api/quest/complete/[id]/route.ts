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
    
    // Recurring Logic
    if (nextCompleted) {
      const now = new Date();
      let nextDate = new Date(now);
      
      // Determine next start date based on duration
      switch (quest.duration) {
        case 'daily':
          nextDate.setDate(now.getDate() + 1);
          nextDate.setHours(0, 0, 0, 0); // Start of next day
          break;
        case 'weekly':
          nextDate.setDate(now.getDate() + 7);
          nextDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          nextDate.setMonth(now.getMonth() + 1);
          nextDate.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          nextDate.setFullYear(now.getFullYear() + 1);
          nextDate.setHours(0, 0, 0, 0);
          break;
        default:
          // No recurrence for unknown types, or treat as daily? 
          // Assuming 'one-time' isn't a type here based on IQuest interface, 
          // but if it was, we'd break. The interface says daily/weekly/monthly/yearly.
          // Fallback to daily if valid enum compliance issues, or just break.
          // Let's assume daily fallback for safety if sticking to enum.
           nextDate.setDate(now.getDate() + 1);
           nextDate.setHours(0, 0, 0, 0);
          break;
      }

      // Check if future quest already exists to prevent duplicates
      const existingFutureQuest = await Quest.findOne({
        userId: user.id,
        goal: quest.goal,
        duration: quest.duration,
        date: { $gte: nextDate },
        completed: false
      });

      if (!existingFutureQuest) {
        // Handle recurrences
        let nextRecurrencesLeft = quest.recurrencesLeft;
        let shouldCreate = true;

        if (typeof nextRecurrencesLeft === 'number') {
           if (nextRecurrencesLeft > 0) {
             nextRecurrencesLeft -= 1;
           } else {
             shouldCreate = false;
           }
        }

        if (shouldCreate) {
          await Quest.create({
            userId: user.id,
            goal: quest.goal,
            duration: quest.duration,
            date: nextDate,
            progress: 0,
            completed: false,
            ratings: [],
            recurrencesLeft: nextRecurrencesLeft
          });
        }
      }
    }

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
