import "server-only";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const UPLOADS_DIR = path.resolve(process.cwd(), ".local-uploads");

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Local storage driver refuses to run in production environment.");
  }
}

export function isLocalConfigured() {
  return process.env.NODE_ENV !== "production";
}

export async function saveLocalFile(relPath, buffer) {
  assertNotProduction();
  const fullPath = path.join(UPLOADS_DIR, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return {
    url: `/api/dev-uploads/${relPath.replace(/\\/g, "/")}`,
    pathname: relPath.replace(/\\/g, "/"),
    size: buffer.length,
  };
}

export async function headLocal(url) {
  assertNotProduction();
  const relPath = url.replace(/^\/api\/dev-uploads\//, "");
  const fullPath = path.join(UPLOADS_DIR, relPath);
  if (!fsSync.existsSync(fullPath)) {
    throw new Error("File not found in local storage.");
  }
  const stat = await fs.stat(fullPath);
  return {
    url,
    pathname: relPath,
    size: stat.size,
    uploadedAt: stat.mtime,
  };
}

export async function deleteLocal(url) {
  assertNotProduction();
  const relPath = url.replace(/^\/api\/dev-uploads\//, "");
  const fullPath = path.join(UPLOADS_DIR, relPath);
  if (fsSync.existsSync(fullPath)) {
    await fs.unlink(fullPath);
  }
}
