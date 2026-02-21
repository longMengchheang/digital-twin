import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { buildProfile } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';

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
