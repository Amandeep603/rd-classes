import "server-only";
import connectDB from "../db/connect.js";
import { AuditLog } from "../db/models/AuditLog.js";

/**
 * Appends an audit entry.
 */
export async function logAuditEvent({
  actorId = null,
  action,
  targetType,
  targetId,
  meta = {},
}) {
  try {
    await connectDB();
    await AuditLog.create({
      actorId,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : "system",
      meta,
      at: new Date(),
    });
  } catch (error) {
    // Audit logging should not crash the primary transaction, but record error in non-prod
    if (process.env.NODE_ENV !== "production") {
      console.error("[AuditLog Error]", error);
    }
  }
}

/**
 * Returns latest audit logs for admin inspection.
 */
export async function getRecentAuditLogs(limit = 200) {
  await connectDB();
  return AuditLog.find()
    .sort({ at: -1 })
    .limit(limit)
    .populate("actorId", "name loginId role")
    .lean();
}
