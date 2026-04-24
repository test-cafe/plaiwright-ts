import { z } from 'zod';

export const passwordSchema = z.string().min(4, { message: 'Enter a valid password' });

export const formLoginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email' }),
  password: passwordSchema,
});

export const formRegisterSchema = formLoginSchema
  .merge(
    z.object({
      fullName: z.string().min(2, { message: 'Enter your first and last name' }),
      confirmPassword: passwordSchema,
    }),
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type TFormLoginData = z.infer<typeof formLoginSchema>;
export type TFormRegisterData = z.infer<typeof formRegisterSchema>;
