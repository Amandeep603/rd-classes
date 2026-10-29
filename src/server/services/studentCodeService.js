import "server-only";
import connectDB from "../db/connect.js";
import { Counter } from "../db/models/Counter.js";

/**
 * Generates an atomic, collision-free student login ID.
 * Format: RD-YYYY-NNN (e.g. RD-2026-001)
 */
export async function getNextLoginId(year = new Date().getFullYear()) {
  await connectDB();
  const counterId = `studentLoginId:${year}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqNumber = String(counter.seq).padStart(3, "0");
  return `RD-${year}-${seqNumber}`;
}

export const getNextStudentCode = getNextLoginId;
