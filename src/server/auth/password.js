import "server-only";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

// Precomputed cost-12 hash used for unknown-ID timing protection
const DUMMY_HASH =
  "$2a$12$e8nZtH8vR3X5Z8s6y7QdLu6y0hM5Y9p3z7B8c1A2b3C4D5E6F7G8H";

export async function hashPassword(plainText) {
  if (!plainText || plainText.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

export async function comparePassword(plainText, hash) {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}

export async function comparePasswordDummy(plainText) {
  // Always run dummy bcrypt compare so timing is indistinguishable from real compare
  return bcrypt.compare(plainText || "dummy", DUMMY_HASH);
}
