import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(1, 'Enter your password.').max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
});

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'faculty', 'student']),
});
