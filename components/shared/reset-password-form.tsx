'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/shared/form';
import { Button } from '@/components/ui/button';
import { WhiteBlock } from '@/components/shared/white-block';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/app/actions';

const schema = z
  .object({
    password: z.string().min(4, { message: 'Password must be at least 4 characters' }),
    confirmPassword: z.string().min(4, { message: 'Password must be at least 4 characters' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type TForm = z.infer<typeof schema>;

interface Props {
  token: string;
}

export const ResetPasswordForm: React.FC<Props> = ({ token }) => {
  const router = useRouter();

  const form = useForm<TForm>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: TForm) => {
    try {
      await resetPassword(token, data.password);
      toast.success('Password updated! Please sign in.', { icon: '✅' });
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message, { icon: '❌' });
    }
  };

  return (
    <WhiteBlock contentClassName="p-8">
      <FormProvider {...form}>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormInput type="password" name="password" label="New password" placeholder="At least 4 characters" required />
          <FormInput type="password" name="confirmPassword" label="Confirm new password" placeholder="Repeat password" required />
          <Button disabled={form.formState.isSubmitting} className="h-12 text-base" type="submit">
            {form.formState.isSubmitting ? 'Saving...' : 'Set new password'}
          </Button>
        </form>
      </FormProvider>
    </WhiteBlock>
  );
};
