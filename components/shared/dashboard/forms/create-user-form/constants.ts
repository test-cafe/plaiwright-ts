import { z } from 'zod';

export const CreateUserFormSchema = z.object({
  fullName: z.string().min(4, { message: 'Enter a valid name' }),
  email: z.string().email({ message: 'Enter a valid email' }),
  password: z.string().min(4, { message: 'Enter a valid password' }),
  role: z.string().min(4, { message: 'Select a role' }),
});

export type CreateUserFormValues = z.infer<typeof CreateUserFormSchema>;
