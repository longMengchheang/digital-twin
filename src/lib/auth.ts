import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { unauthorized } from './api-response';

// Lazy load secret to avoid build-time errors
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined'); 
  }
  return secret;
}

export interface DecodedUser {
  id: string;
  _id?: string;
  email?: string;
  [key: string]: unknown;
}

interface AuthPayload {
  user: DecodedUser;
}

export function signToken(user: DecodedUser): string {
  return jwt.sign({ user }, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(req: Request): DecodedUser | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthPayload;
    const payloadUser = decoded.user || ({} as DecodedUser);
    const normalizedId =
      typeof payloadUser.id === 'string' && payloadUser.id.trim()
        ? payloadUser.id.trim()
        : typeof payloadUser._id === 'string' && payloadUser._id.trim()
          ? payloadUser._id.trim()
          : '';

    if (!normalizedId) {
      return null;
    }

    return {
      ...payloadUser,
      id: normalizedId,
      _id: normalizedId,
    };
  } catch {
    return null;
  }
}

export function withAuth<T = any>(
  handler: (req: Request, context: T, user: DecodedUser) => Promise<NextResponse>
) {
  return async (req: Request, context: T) => {
    const user = verifyToken(req);
    if (!user) {
      return unauthorized();
    }
    return handler(req, context, user);
  };
}
