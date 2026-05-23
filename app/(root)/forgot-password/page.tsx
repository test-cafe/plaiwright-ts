import { Container } from '@/components/shared/container';
import { Title } from '@/components/shared/title';
import { ForgotPasswordForm } from '@/components/shared/forgot-password-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Pizza | Forgot Password',
  robots: 'noindex',
};

export default function ForgotPasswordPage() {
  return (
    <Container className="mt-10 max-w-md mx-auto">
      <Title text="Forgot password" size="xl" className="font-extrabold mb-6" />
      <ForgotPasswordForm />
    </Container>
  );
}
