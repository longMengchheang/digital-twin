import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Quest from '@/lib/models/Quest';
import { unauthorized, serverError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return unauthorized('No token, authorization denied.');
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ msg: 'Invalid quest id.' }, { status: 400 });
    }

    const quest = await Quest.findOneAndDelete({ _id: id, userId: user.id });

    if (!quest) {
      return NextResponse.json({ msg: 'Quest not found.' }, { status: 404 });
    }

    return NextResponse.json({ msg: 'Quest deleted.' });
  } catch (error) {
    return serverError(error, 'Delete quest error');
  }
}
