import { z } from "zod";

export const loginSchema = z.object({
  loginId: z
    .string()
    .min(1, "Login ID is required")
    .max(50, "Login ID is too long")
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const studentCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().default(""),
  loginId: z
    .string()
    .min(4, "Login ID must be at least 4 characters")
    .max(30, "Login ID cannot exceed 30 characters")
    .regex(/^[a-z0-9._-]+$/, "Only letters, numbers, dot, underscore, dash allowed")
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  deviceLimit: z.coerce.number().min(1).max(3).default(1),
  mustChangePassword: z.boolean().optional().default(false),
  courseIds: z.array(z.string()).optional().default([]),
});

export const studentUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().default(""),
});

export const studentPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  revokeSessions: z.boolean().optional().default(true),
});

export const courseCreateSchema = z.object({
  title: z.string().min(2, "Title is required").max(150),
  description: z.string().max(2000).optional().default(""),
  thumbnail: z.string().url("Must be a valid URL").or(z.literal("")).optional().default(""),
  published: z.boolean().optional().default(false),
  order: z.coerce.number().optional().default(0),
});

export const courseUpdateSchema = courseCreateSchema.extend({
  slug: z.string().min(2).max(100).optional(),
});

export const lectureCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  section: z.string().min(1, "Section name is required").default("General"),
  title: z.string().min(1, "Title is required").max(200),
  vimeoUrl: z.string().min(1, "Vimeo URL or ID is required"),
  durationSec: z.coerce.number().min(0).default(0),
  description: z.string().max(3000).optional().default(""),
  published: z.boolean().optional().default(true),
  isPreview: z.boolean().optional().default(false),
  order: z.coerce.number().optional(),
});

export const lectureUpdateSchema = z.object({
  section: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  vimeoUrl: z.string().optional(),
  durationSec: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  isPreview: z.boolean().optional(),
  order: z.coerce.number().optional(),
});

export const deviceApproveSchema = z.object({
  mode: z.enum(["add", "replace", "raise-and-add"]).default("add"),
  replaceDeviceId: z.string().optional().nullable(),
});

export const progressSaveSchema = z.object({
  lectureId: z.string().min(1, "Lecture ID is required"),
  positionSec: z.coerce.number().min(0),
  durationSec: z.coerce.number().min(0),
  forceCompleted: z.boolean().optional().default(false),
});
