import { Container } from '@/components/shared/container';
import { Title } from '@/components/shared/title';
import { ResetPasswordForm } from '@/components/shared/reset-password-form';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Pizza | Reset Password',
  robots: 'noindex',
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/forgot-password');
  }

  return (
    <Container className="mt-10 max-w-md mx-auto">
      <Title text="Set new password" size="xl" className="font-extrabold mb-6" />
      <ResetPasswordForm token={token} />
    </Container>
  );
}
