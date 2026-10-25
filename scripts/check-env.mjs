import fs from "fs";
import path from "path";

// Load .env.local without exposing/printing values
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val.replace(/^["']|["']$/g, "");
        }
      }
    }
  }
}

loadEnv();

console.log("=== RD Classes Production Environment Readiness Audit ===");

const isProd = process.env.NODE_ENV === "production";
const errors = [];
const warnings = [];
const passes = [];

function pass(name, detail) {
  passes.push(`✓ [PASS] ${name}${detail ? ` (${detail})` : ""}`);
}

function error(name, detail) {
  errors.push(`✕ [FAIL] ${name}: ${detail}`);
}

function warn(name, detail) {
  warnings.push(`! [WARN] ${name}: ${detail}`);
}

// 1. MONGODB_URI
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  error("MONGODB_URI", "Missing connection string.");
} else if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
  error("MONGODB_URI", "Must start with mongodb:// or mongodb+srv://");
} else {
  // Extract database name from URI
  try {
    const urlObj = new URL(mongoUri.replace("mongodb+srv://", "https://").replace("mongodb://", "http://"));
    const dbName = urlObj.pathname.replace(/^\//, "").split("?")[0];
    if (isProd && dbName && dbName.endsWith("_dev")) {
      error("MONGODB_URI", `Database name "${dbName}" ends with "_dev" in production mode.`);
    } else {
      pass("MONGODB_URI", `Configured with database "${dbName || "default"}"`);
    }
  } catch {
    pass("MONGODB_URI", "Configured (format check passed)");
  }
}

// 2. AUTH_SECRET
const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
  error("AUTH_SECRET", "Missing authentication secret.");
} else if (authSecret.length < 32) {
  error("AUTH_SECRET", `Must be at least 32 characters long (current length: ${authSecret.length}).`);
} else {
  pass("AUTH_SECRET", `Configured (length: ${authSecret.length} chars)`);
}

// 3. STORAGE_DRIVER & BLOB_READ_WRITE_TOKEN
const storageDriver = process.env.STORAGE_DRIVER || "local";
if (isProd && storageDriver === "local") {
  error("STORAGE_DRIVER", "Must not be 'local' in production mode. Set STORAGE_DRIVER=blob.");
} else if (storageDriver === "blob") {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    error("BLOB_READ_WRITE_TOKEN", "Required when STORAGE_DRIVER=blob.");
  } else if (!blobToken.startsWith("vercel_blob_rw_")) {
    warn("BLOB_READ_WRITE_TOKEN", "Does not follow typical 'vercel_blob_rw_' prefix.");
  } else {
    pass("STORAGE_DRIVER", "Configured for Vercel Blob with valid token");
  }
} else {
  pass("STORAGE_DRIVER", `Using '${storageDriver}' driver`);
}

// 4. EMAIL_DRIVER & consistency
const emailDriver = process.env.EMAIL_DRIVER || "console";
if (emailDriver === "resend") {
  if (!process.env.RESEND_API_KEY) {
    error("RESEND_API_KEY", "Required when EMAIL_DRIVER=resend.");
  } else {
    pass("EMAIL_DRIVER", "Configured for Resend");
  }
} else if (emailDriver === "smtp") {
  const missing = [];
  if (!process.env.EMAIL_HOST) missing.push("EMAIL_HOST");
  if (!process.env.EMAIL_PORT) missing.push("EMAIL_PORT");
  if (!process.env.EMAIL_USER) missing.push("EMAIL_USER");
  if (!process.env.EMAIL_PASS) missing.push("EMAIL_PASS");
  if (missing.length > 0) {
    error("EMAIL_DRIVER (smtp)", `Missing variables: ${missing.join(", ")}`);
  } else {
    pass("EMAIL_DRIVER", "Configured for SMTP");
  }
} else if (emailDriver === "console") {
  if (isProd) {
    warn("EMAIL_DRIVER", "Using 'console' driver in production. Emails will be logged locally instead of delivered.");
  } else {
    pass("EMAIL_DRIVER", "Console driver active (development/testing)");
  }
}

// 5. NEXT_PUBLIC_SITE_URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) {
  warn("NEXT_PUBLIC_SITE_URL", "Not set. Defaulting to standard domain.");
} else {
  try {
    new URL(siteUrl);
    pass("NEXT_PUBLIC_SITE_URL", "Valid URL format");
  } catch {
    error("NEXT_PUBLIC_SITE_URL", "Must be a valid HTTP/HTTPS URL.");
  }
}

// Output report
console.log("");
passes.forEach((p) => console.log(p));
warnings.forEach((w) => console.log(w));
errors.forEach((e) => console.log(e));

console.log("");
if (errors.length > 0) {
  console.error(`✕ Check failed with ${errors.length} error(s). Please review your configuration.`);
  process.exit(1);
} else {
  console.log(`✓ All critical environment variables validated successfully (${warnings.length} warning(s)).`);
  process.exit(0);
}
