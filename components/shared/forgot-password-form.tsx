'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/shared/form';
import { Button } from '@/components/ui/button';
import { WhiteBlock } from '@/components/shared/white-block';
import toast from 'react-hot-toast';
import { requestPasswordReset } from '@/app/actions';

const schema = z.object({
  email: z.string().email({ message: 'Enter a valid email' }),
});

type TForm = z.infer<typeof schema>;

export const ForgotPasswordForm: React.FC = () => {
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<TForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: TForm) => {
    try {
      await requestPasswordReset(data.email);
      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again.', { icon: '❌' });
    }
  };

  return (
    <WhiteBlock contentClassName="p-8">
      {submitted ? (
        <p className="text-center text-gray-600">
          If an account with that email exists, a reset link has been sent. Check your inbox.
        </p>
      ) : (
        <FormProvider {...form}>
          <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <p className="text-gray-500 text-sm">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <FormInput name="email" label="E-Mail" placeholder="user@example.com" required />
            <Button data-testid="reset-submit" disabled={form.formState.isSubmitting} className="h-12 text-base" type="submit">
              {form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        </FormProvider>
      )}
    </WhiteBlock>
  );
};
