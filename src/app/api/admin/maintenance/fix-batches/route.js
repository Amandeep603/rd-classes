import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb.ts";
import { User, ActivityLog } from "@/lib/models/index.ts";
import { normalizeBatch } from "@/server/services/studentAdminService.js";

/**
 * GET: Dry Run for Fix Batch Values
 * Returns count of affected students, distinct mappings, and sample loginIds.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    await connectDB();

    const affectedStudents = await User.find(
      {
        role: "student",
        batch: { $regex: "^\\d{4,6}$" },
      },
      { loginId: 1, batch: 1 }
    ).lean();

    const rollbackCount = await User.countDocuments({
      role: "student",
      batchRaw: { $exists: true, $ne: null },
    });

    const mappingMap = new Map();
    for (const s of affectedStudents) {
      const fromVal = s.batch;
      const toVal = normalizeBatch(fromVal);
      if (!mappingMap.has(fromVal)) {
        mappingMap.set(fromVal, { from: fromVal, to: toVal, count: 0 });
      }
      mappingMap.get(fromVal).count++;
    }

    const mappings = Array.from(mappingMap.values());
    const sampleLoginIds = affectedStudents.slice(0, 10).map((s) => s.loginId);

    return NextResponse.json({
      success: true,
      dryRun: true,
      count: affectedStudents.length,
      mappings,
      sampleLoginIds,
      canRollback: rollbackCount > 0,
      rollbackCount,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Apply or Rollback Fix Batch Values
 * Body: { action: "apply" | "rollback" }
 */
export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;
  const adminId = auth.user._id;

  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const action = body.action || "apply";

    if (action === "rollback") {
      const rollbackStudents = await User.find({
        role: "student",
        batchRaw: { $exists: true, $ne: null },
      });

      let restoredCount = 0;
      for (const s of rollbackStudents) {
        s.batch = s.batchRaw;
        s.batchRaw = undefined;
        await s.save();
        restoredCount++;
      }

      await ActivityLog.create({
        actorId: adminId,
        action: "student.rollback_batches",
        entity: "User",
        meta: { restoredCount, adminLoginId: auth.user.loginId },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        action: "rollback",
        restoredCount,
        message: `Successfully rolled back ${restoredCount} student batch values.`,
      });
    }

    // Apply fix
    const affectedStudents = await User.find({
      role: "student",
      batch: { $regex: "^\\d{4,6}$" },
    });

    const mappingMap = new Map();
    let updatedCount = 0;

    for (const s of affectedStudents) {
      const fromVal = s.batch;
      const toVal = normalizeBatch(fromVal);

      if (!mappingMap.has(fromVal)) {
        mappingMap.set(fromVal, { from: fromVal, to: toVal, count: 0 });
      }
      mappingMap.get(fromVal).count++;

      s.batchRaw = fromVal;
      s.batch = toVal;
      await s.save();
      updatedCount++;
    }

    const mappings = Array.from(mappingMap.values());

    await ActivityLog.create({
      actorId: adminId,
      action: "student.fix_batches",
      entity: "User",
      meta: {
        affectedCount: updatedCount,
        mappings,
        adminLoginId: auth.user.loginId,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      action: "apply",
      count: updatedCount,
      mappings,
      message: `Successfully converted ${updatedCount} corrupted batch serials to standard formats.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

