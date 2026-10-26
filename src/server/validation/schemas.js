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
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid email format",
    })
    .optional()
    .default(""),
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
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid email format",
    })
    .optional()
    .default(""),
});

export const studentPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  revokeSessions: z.boolean().optional().default(true),
});

export const courseSchema = z
  .object({
    title: z.string().min(2, "Title is required").max(150),
    subtitle: z.string().max(100).optional().default(""),
    slug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .max(100)
      .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
    category: z.enum(["class12", "class11", "recorded", "test-series", "crash"]),
    classLabel: z.string().max(50).optional().default("Class 12"),
    badgeText: z.string().max(50).optional().default(""),
    badgeVariant: z
      .enum(["crown-navy", "yellow", "orange", "green", "purple", "red", ""])
      .optional()
      .default("crown-navy"),
    tone: z.enum(["sky", "yellow", "orange", "green", "purple", "red"]),
    illustration: z
      .enum([
        "books-blue",
        "open-book",
        "revision-plan",
        "target",
        "laptop-play",
        "checklist-clock",
        "notebook-red",
        "",
      ])
      .optional()
      .default("books-blue"),
    illustrationAssetId: z.string().nullable().optional().default(null),
    description: z.string().max(2000).optional().default(""),
    metaIcon: z.enum(["video", "file", "clock"]).optional().default("video"),
    metaText: z.string().max(100).optional().default(""),
    language: z.string().max(50).optional().default("Bilingual"),
    facultyName: z.string().max(100).optional().default("Ronak Dugar"),
    facultyRole: z.string().max(100).optional().default("Lead Accountancy Faculty"),
    facultyAvatarAssetId: z.string().nullable().optional().default(null),
    whatsappText: z.string().max(500).optional().default(""),
    thumbnail: z.string().optional().default(""),
    published: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
    order: z.coerce.number().optional().default(0),
    about: z.string().optional().default(""),
    highlights: z
      .array(
        z.object({
          icon: z.string().default("video"),
          text: z.string().default(""),
        })
      )
      .max(4)
      .optional()
      .default([]),
    includes: z
      .array(
        z.object({
          icon: z.string().default("check"),
          text: z.string().default(""),
        })
      )
      .max(8)
      .optional()
      .default([]),
    faqs: z
      .array(
        z.object({
          q: z.string().default(""),
          a: z.string().default(""),
        })
      )
      .optional()
      .default([]),
    facultyBullets: z.array(z.string()).max(4).optional().default([]),
    facultyProfileUrl: z.string().optional().default(""),
    heroIllustration: z.enum(["books-subjects", "books-light"]).optional().default("books-subjects"),
  })
  .superRefine((data, ctx) => {
    if (data.published) {
      if (!data.title || data.title.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["title"],
          message: "Published courses require a title",
        });
      }
      if (!data.slug || data.slug.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slug"],
          message: "Published courses require a slug",
        });
      }
      if (!data.category) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["category"],
          message: "Published courses require a category",
        });
      }
      if (!data.tone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tone"],
          message: "Published courses require a tone",
        });
      }
      if (!data.description || data.description.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["description"],
          message: "Published courses require a description",
        });
      }
      if (!data.metaText || data.metaText.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metaText"],
          message: "Published courses require metaText",
        });
      }
    }
  });

export const courseCreateSchema = courseSchema;
export const courseUpdateSchema = courseSchema;

export const lectureCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  section: z.string().min(1, "Section name is required").default("General"),
  title: z.string().min(1, "Title is required").max(200),
  vimeoUrl: z.string().min(1, "Vimeo URL or ID is required"),
  durationSec: z.coerce.number().min(0).default(0),
  description: z.string().max(3000).optional().default(""),
  published: z.boolean().optional().default(true),
  freePreview: z.boolean().optional(),
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
  freePreview: z.boolean().optional(),
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

export const noteCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    kind: z.enum(["notes", "practice", "formula", "paper"]).default("notes"),
    source: z.enum(["file", "link"]).default("file"),
    externalUrl: z.string().optional().default(""),
    fileUrl: z.string().optional().default(""),
    fileKey: z.string().optional().default(""),
    fileSize: z.coerce.number().min(0).default(0),
    pageCount: z.coerce.number().min(0).default(0),
    section: z.string().optional().default("General"),
    courseIds: z.array(z.string()).optional().default([]),
    published: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.source === "link") {
      const url = (data.externalUrl || "").trim();
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "External link URL is required for link notes",
          path: ["externalUrl"],
        });
      } else if (!/^https?:\/\/.+/i.test(url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "External URL must begin with http:// or https://",
          path: ["externalUrl"],
        });
      }
    } else {
      if (!data.fileUrl && !data.fileKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A file must be uploaded for file-based notes",
          path: ["fileUrl"],
        });
      }
    }
  });

export const noteUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  kind: z.enum(["notes", "practice", "formula", "paper"]).optional(),
  source: z.enum(["file", "link"]).optional(),
  externalUrl: z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
      message: "External URL must begin with http:// or https://",
    }),
  fileUrl: z.string().optional(),
  fileKey: z.string().optional(),
  fileSize: z.coerce.number().min(0).optional(),
  pageCount: z.coerce.number().min(0).optional(),
  section: z.string().optional(),
  courseIds: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});
