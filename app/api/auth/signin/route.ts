import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, window: 60, prefix: 'auth:signin' });
  if (limited) return limited;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      user: { id: user.id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    console.error('[AUTH_SIGNIN]', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
