'use client';

import { Button } from '@/components/ui/button';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TFormRegisterData, formRegisterSchema } from './schemas';
import toast from 'react-hot-toast';
import { FormInput } from '@/components/shared/form';
import { registerUser } from '@/app/actions';

interface Props {
  onClose?: VoidFunction;
  onClickLogin?: VoidFunction;
}

export const RegisterForm: React.FC<Props> = ({ onClose, onClickLogin }) => {
  const form = useForm<TFormRegisterData>({
    resolver: zodResolver(formRegisterSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: TFormRegisterData) => {
    try {
      await registerUser({
        email: data.email,
        fullName: data.fullName,
        password: data.password,
      });

      toast.success('Registration successful! You can now sign in.', {
        icon: '✅',
      });

      onClose?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return toast.error(message, { icon: '❌' });
    }
  };

  return (
    <FormProvider {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <FormInput name="email" label="E-Mail" required />
        <FormInput name="fullName" label="Full name" required />
        <FormInput name="password" label="Password" type="password" required />
        <FormInput name="confirmPassword" label="Confirm password" type="password" required />

        <Button disabled={form.formState.isSubmitting} className="h-12 text-base" type="submit">
          Register
        </Button>
      </form>
    </FormProvider>
  );
};
