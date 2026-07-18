import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/send-email';

export async function sendVerificationEmail(user: { id: number; email: string; fullName: string }) {
  const code = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationCode.upsert({
    where: { userId: user.id },
    update: { code, expiresAt },
    create: { userId: user.id, code, expiresAt },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/auth/verify?code=${code}`;

  await sendEmail(
    user.email,
    'Verify your Next Pizza account',
    `<p>Hi ${user.fullName},</p>
     <p>Confirm your email to activate your account. This link expires in 24 hours.</p>
     <p><a href="${verifyUrl}">${verifyUrl}</a></p>
     <p>If you didn't create an account, you can safely ignore this email.</p>`,
  );
}
