import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import ChatSignal from '@/lib/models/ChatSignal';
import CheckIn from '@/lib/models/CheckIn';
import Quest from '@/lib/models/Quest';
import User from '@/lib/models/User';
import { generateInsightMap } from '@/lib/insight-map';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();

    const authUser = verifyToken(req);
    if (!authUser) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const start30d = new Date(today);
    start30d.setDate(today.getDate() - 29);

    const [user, checkInsRaw, questsRaw, chatRaw] = await Promise.all([
      User.findById(authUser.id).select('level').lean(),
      CheckIn.find({ userId: authUser.id, date: { $gte: start30d } }).sort({ date: -1 }).lean(),
      Quest.find({ userId: authUser.id }).sort({ date: -1 }).limit(120).lean(),
      ChatSignal.find({ userId: authUser.id, createdAt: { $gte: start30d } })
        .select('signalType intensity confidence createdAt')
        .sort({ createdAt: -1 })
        .limit(1600)
        .lean(),
    ]);
    
    // Mock missing data
    const featureRaw: any[] = [];

    if (!user) {
      return NextResponse.json({ msg: 'User not found.' }, { status: 404 });
    }

    const insightMap = generateInsightMap(
      user,
      checkInsRaw,
      questsRaw,
      chatRaw,
      featureRaw,
      now
    );

    return NextResponse.json(insightMap);
  } catch (error) {
    console.error('Insight map error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
