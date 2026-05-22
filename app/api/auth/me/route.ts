import { getUserSession } from '@/lib/get-user-session';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getUserSession();

    if (!user) {
      return NextResponse.json({ message: '[USER_GET] Unauthorized' }, { status: 401 });
    }

    const data = await prisma.user.findUnique({
      where: {
        id: Number(user.id),
      },
      select: {
        fullName: true,
        email: true,
        password: false,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error({ error }, '[USER_GET] failed');
    return NextResponse.json({ message: '[USER_GET] Server error' }, { status: 500 });
  }
}
