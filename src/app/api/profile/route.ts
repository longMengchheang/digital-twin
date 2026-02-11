import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { buildProfile } from '@/lib/profile-service';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

interface ProfileUpdatePayload {
  name?: string;
  age?: number;
  email?: string;
  location?: string;
  bio?: string;
  avatarStage?: string;
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

    // Pass the updated user object to avoid redundant fetch
    // Using .toObject() to match .lean() behavior
    const profile = await buildProfile(authUser.id, user.toObject());
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
});
