import "server-only";
import { LoginAttempt } from "../db/models/LoginAttempt.js";
import connectDB from "../db/connect.js";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export async function checkRateLimit(key) {
  await connectDB();
  const now = new Date();
  const attempt = await LoginAttempt.findOne({ key }).lean();

  if (!attempt) {
    return { locked: false };
  }

  if (attempt.lockedUntil && new Date(attempt.lockedUntil) > now) {
    const remainingSec = Math.ceil(
      (new Date(attempt.lockedUntil).getTime() - now.getTime()) / 1000
    );
    return {
      locked: true,
      remainingSec,
      message: `Too many failed attempts. Locked for ${Math.ceil(remainingSec / 60)} minutes.`,
    };
  }

  return { locked: false };
}

export async function recordFailedAttempt(
  key,
  maxFailures = 5,
  windowMs = FIFTEEN_MINUTES_MS,
  lockDurationMs = FIFTEEN_MINUTES_MS
) {
  await connectDB();
  const now = new Date();
  const attempt = await LoginAttempt.findOne({ key });

  if (!attempt) {
    await LoginAttempt.create({
      key,
      count: 1,
      firstAt: now,
      lockedUntil: null,
      expireAt: new Date(now.getTime() + windowMs),
    });
    return { locked: false };
  }

  // If previous window expired
  if (now.getTime() - new Date(attempt.firstAt).getTime() > windowMs) {
    attempt.count = 1;
    attempt.firstAt = now;
    attempt.lockedUntil = null;
    attempt.expireAt = new Date(now.getTime() + windowMs);
    await attempt.save();
    return { locked: false };
  }

  attempt.count += 1;
  if (attempt.count >= maxFailures) {
    const lockUntil = new Date(now.getTime() + lockDurationMs);
    attempt.lockedUntil = lockUntil;
    attempt.expireAt = lockUntil;
    await attempt.save();
    return {
      locked: true,
      remainingSec: Math.ceil(lockDurationMs / 1000),
      message: `Too many failed attempts. Locked for ${Math.ceil(lockDurationMs / 60000)} minutes.`,
    };
  }

  attempt.expireAt = new Date(new Date(attempt.firstAt).getTime() + windowMs);
  await attempt.save();
  return { locked: false };
}

export async function resetRateLimit(key) {
  await connectDB();
  await LoginAttempt.deleteOne({ key });
}
