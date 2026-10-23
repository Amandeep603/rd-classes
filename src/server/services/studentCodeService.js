import "server-only";
import connectDB from "../db/connect.js";
import { Counter } from "../db/models/Counter.js";

/**
 * Generates an atomic, collision-free student code.
 * Format: RD-YYYY-NNN (e.g. RD-2025-001)
 */
export async function getNextStudentCode(year = new Date().getFullYear()) {
  await connectDB();
  const counterId = `studentCode:${year}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqNumber = String(counter.seq).padStart(3, "0");
  return `RD-${year}-${seqNumber}`;
}
