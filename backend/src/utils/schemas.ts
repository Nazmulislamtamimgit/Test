import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters") // bcrypt ignores bytes past 72
  .regex(/[A-Za-z]/, "Password needs a letter")
  .regex(/[0-9]/, "Password needs a number");

export const registerSchema = z.object({ name: z.string().trim().min(1).max(100), email, password });
export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: email.optional(),
    currentPassword: z.string().max(72).optional(),
    newPassword: password.optional(),
  })
  .refine((v) => !v.newPassword || !!v.currentPassword, {
    message: "Current password is required to set a new one",
    path: ["currentPassword"],
  });

const isoDate = z.string().datetime({ offset: true });

export const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: isoDate.nullable().optional(),
});
export const taskUpdateSchema = taskSchema.partial();

export const taskQuerySchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  q: z.string().trim().max(100).optional(),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(20000),
});
export const noteUpdateSchema = noteSchema.partial();
