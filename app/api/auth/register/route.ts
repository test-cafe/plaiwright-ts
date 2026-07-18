import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/send-verification-email';
import { hashSync } from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 3, window: 60, prefix: 'auth:register' });
  if (limited) return limited;

  try {
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      if (existing.verified) {
        return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
      }

      // Unverified duplicate signup: refresh the code so the user isn't stuck.
      await sendVerificationEmail(existing);
      return NextResponse.json({
        user: { id: existing.id, fullName: existing.fullName, email: existing.email },
      });
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashSync(password, 10),
      },
    });

    await sendVerificationEmail(user);

    return NextResponse.json({
      user: { id: user.id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    console.error('[AUTH_REGISTER]', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
