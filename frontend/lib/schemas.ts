import { z } from "zod";

const password = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters")
  .regex(/[A-Za-z]/, "Must contain a letter")
  .regex(/[0-9]/, "Must contain a number");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().email("Enter a valid email"),
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
export type RegisterForm = z.infer<typeof registerSchema>;

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.string().optional(),
});
export type TaskForm = z.infer<typeof taskFormSchema>;

export const noteFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  content: z.string().max(20000),
});
export type NoteForm = z.infer<typeof noteFormSchema>;

export const detailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
});
export type DetailsForm = z.infer<typeof detailsSchema>;

export const passwordSchema = z
  .object({ currentPassword: z.string().min(1, "Required"), newPassword: password, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { message: "Passwords do not match", path: ["confirm"] });
export type PasswordForm = z.infer<typeof passwordSchema>;
