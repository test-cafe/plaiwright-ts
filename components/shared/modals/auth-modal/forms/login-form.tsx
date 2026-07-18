import React from 'react';
import { Title } from '@/components/shared/title';
import { Button } from '@/components/ui/button';
import { TFormLoginData, formLoginSchema } from './schemas';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { FormInput } from '@/components/shared/form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  onClose?: VoidFunction;
}

export const LoginForm: React.FC<Props> = ({ onClose }) => {
  const router = useRouter();
  const form = useForm<TFormLoginData>({
    resolver: zodResolver(formLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: TFormLoginData) => {
    try {
      const resp = await signIn('credentials', {
        ...data,
        redirect: false,
      });

      if (!resp?.ok) {
        // NextAuth reports errors thrown in authorize() verbatim; null returns
        // surface as the generic 'CredentialsSignin' code.
        const message =
          resp?.error && resp.error !== 'CredentialsSignin' ? resp.error : 'Invalid E-Mail or password';
        return toast.error(message, {
          icon: '❌',
        });
      }

      onClose?.();
      router.refresh();
    } catch (error) {
      toast.error('Failed to sign in', {
        icon: '❌',
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex justify-between items-center">
          <div className="mr-2">
            <Title text="Sign in" size="md" className="font-bold" />
            <p className="text-gray-400">Enter your email to sign in to your account</p>
          </div>
          <Image src="/assets/images/phone-icon.png" alt="phone-icon" width={60} height={60} />
        </div>

        <FormInput name="email" label="E-Mail" placeholder="user@test.ru" required />
        <FormInput type="password" name="password" label="Password" placeholder="Password" required />
        <div className="text-right -mt-3">
          <Link
            href="/forgot-password"
            onClick={onClose}
            className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button data-testid="login-submit" disabled={form.formState.isSubmitting} className="h-12 text-base" type="submit">
          {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </FormProvider>
  );
};
