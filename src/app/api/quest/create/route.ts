import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { normalizeDuration } from '@/lib/progression';

import Quest from '@/lib/models/Quest';
import { badRequest, unauthorized, serverError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface CreateQuestPayload {
  goal?: string;
  duration?: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return unauthorized('No token, authorization denied.');
    }

    const body = (await req.json()) as CreateQuestPayload;
    const goal = String(body.goal || '').trim();
    const duration = normalizeDuration(String(body.duration || 'daily'));

    if (!goal) {
      return badRequest('Goal is required.');
    }

    if (goal.length > 100) {
      return badRequest('Goal must be 100 characters or less.');
    }

    const quest = new Quest({
      userId: user.id,
      goal,
      duration,
      progress: 0,
      completed: false,
      completedDate: null,
      date: new Date(),
    });

    await quest.save();



    return NextResponse.json({
      msg: 'Quest created.',
      quest,
    });
  } catch (error) {
    return serverError(error, 'Create quest error');
  }
}
