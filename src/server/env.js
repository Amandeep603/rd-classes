import "server-only";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  VIMEO_ACCESS_TOKEN: z.string().optional().default(""),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("http://localhost:3000"),
  ADMIN_LOGIN_ID: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  MONGODB_URI_TEST: z.string().optional(),
});

let parsedEnv = null;

export function getEnv() {
  if (!parsedEnv) {
    const result = envSchema.safeParse({
      MONGODB_URI: process.env.MONGODB_URI,
      AUTH_SECRET: process.env.AUTH_SECRET,
      VIMEO_ACCESS_TOKEN: process.env.VIMEO_ACCESS_TOKEN,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      ADMIN_LOGIN_ID: process.env.ADMIN_LOGIN_ID,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      MONGODB_URI_TEST: process.env.MONGODB_URI_TEST,
    });

    if (!result.success) {
      const formatted = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(`[RD Classes Environment Error] Invalid configuration: ${formatted}`);
    }

    parsedEnv = result.data;
  }
  return parsedEnv;
}

export const env = new Proxy(
  {},
  {
    get(_target, prop) {
      const current = getEnv();
      return current[prop];
    },
  }
);
