import { z } from 'zod';

export const orderFormSchema = z.object({
  firstName: z.string().min(2, { message: 'Enter a valid first name' }),
  lastName: z.string().min(2, { message: 'Enter a valid last name' }),
  email: z.string().email({ message: 'Enter a valid email' }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, { message: 'Enter a valid phone number (e.g. +12125552368)' }),
  address: z
    .string()
    .min(10, { message: 'Enter your full address including street number' })
    .regex(/\d/, { message: 'Address must include a street number' }),
  comment: z.string().optional(),
});

export type TFormOrderData = z.infer<typeof orderFormSchema>;
