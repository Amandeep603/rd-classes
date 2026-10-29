import connectDB from "@/lib/mongodb";
import { Notification } from "@/lib/models/Notification";

/**
 * Creates an admin notification with de-duplication for pending device requests.
 */
export async function createAdminNotification({
  type,
  title,
  message,
  link = "",
  entityId = null,
}) {
  try {
    await connectDB();

    // De-duplicate: one unread notification per pending device request
    if (type === "device_request" && entityId) {
      const existingUnread = await Notification.findOne({
        recipientRole: "admin",
        type: "device_request",
        entityId: entityId.toString(),
        readAt: null,
      });
      if (existingUnread) {
        return existingUnread;
      }
    }

    const doc = await Notification.create({
      recipientRole: "admin",
      type,
      title,
      message,
      link,
      entityId: entityId ? entityId.toString() : null,
      readAt: null,
    });

    return doc;
  } catch (err) {
    console.error("[NotificationService] Error creating admin notification:", err);
    return null;
  }
}

/**
 * Fetch latest 20 notifications + unread count for admin.
 */
export async function getAdminNotifications(limit = 20) {
  await connectDB();
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipientRole: "admin" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipientRole: "admin", readAt: null }),
  ]);

  return { notifications, unreadCount };
}

/**
 * Mark one or all notifications as read for admin.
 */
export async function markNotificationsAsRead({ notificationId = null, markAll = false } = {}) {
  await connectDB();
  const now = new Date();

  if (markAll) {
    const res = await Notification.updateMany(
      { recipientRole: "admin", readAt: null },
      { $set: { readAt: now } }
    );
    return { success: true, count: res.modifiedCount };
  }

  if (notificationId) {
    const res = await Notification.updateOne(
      { _id: notificationId, recipientRole: "admin", readAt: null },
      { $set: { readAt: now } }
    );
    return { success: true, count: res.modifiedCount };
  }

  return { success: false, error: "Missing parameters" };
}

/**
 * Creates a student notification scoped to a student or course.
 */
export async function createStudentNotification({
  studentId = null,
  courseId = null,
  type,
  title,
  message = "",
  link = "",
  entityId = null,
}) {
  try {
    await connectDB();
    const doc = await Notification.create({
      recipientRole: "student",
      studentId: studentId || null,
      courseId: courseId || null,
      type,
      title,
      message,
      link,
      entityId: entityId ? entityId.toString() : null,
      readAt: null,
      readBy: [],
    });
    return doc;
  } catch (err) {
    console.error("[NotificationService] Error creating student notification:", err);
    return null;
  }
}

/**
 * Fetches latest 10 notifications for a student.
 */
export async function getStudentNotifications(studentId, activeCourseIds = [], limit = 10) {
  await connectDB();
  const sId = typeof studentId === "string" ? studentId : studentId?.toString();
  const cIds = (activeCourseIds || []).map((id) => (typeof id === "string" ? id : id?.toString()));

  const filter = {
    recipientRole: "student",
    $or: [
      { studentId: sId },
      { courseId: { $in: cIds } },
      { studentId: null, courseId: null },
    ],
  };

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const mapped = notifications.map((n) => {
    let isRead = false;
    if (n.studentId && n.studentId.toString() === sId) {
      isRead = Boolean(n.readAt);
    } else if (n.readBy && Array.isArray(n.readBy)) {
      isRead = n.readBy.some((r) => r.toString() === sId);
    }
    return {
      _id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      createdAt: n.createdAt,
      isRead,
    };
  });

  const unreadCount = mapped.filter((n) => !n.isRead).length;

  return { notifications: mapped, unreadCount };
}

/**
 * Marks a student notification as read.
 */
export async function markStudentNotificationAsRead(notificationId, studentId) {
  await connectDB();
  const notif = await Notification.findById(notificationId);
  if (!notif) return { success: false, error: "Notification not found" };

  const sId = typeof studentId === "string" ? studentId : studentId?.toString();
  if (notif.studentId && notif.studentId.toString() === sId) {
    notif.readAt = new Date();
  } else {
    if (!notif.readBy) notif.readBy = [];
    if (!notif.readBy.some((r) => r.toString() === sId)) {
      notif.readBy.push(sId);
    }
  }
  await notif.save();
  return { success: true };
}

/**
 * Marks all notifications for a student as read.
 */
export async function markAllStudentNotificationsAsRead(studentId, activeCourseIds = []) {
  await connectDB();
  const sId = typeof studentId === "string" ? studentId : studentId?.toString();
  const cIds = (activeCourseIds || []).map((id) => (typeof id === "string" ? id : id?.toString()));

  const filter = {
    recipientRole: "student",
    $or: [
      { studentId: sId },
      { courseId: { $in: cIds } },
      { studentId: null, courseId: null },
    ],
  };

  const notifs = await Notification.find(filter);
  const now = new Date();
  for (const notif of notifs) {
    if (notif.studentId && notif.studentId.toString() === sId) {
      notif.readAt = now;
    } else {
      if (!notif.readBy) notif.readBy = [];
      if (!notif.readBy.some((r) => r.toString() === sId)) {
        notif.readBy.push(sId);
      }
    }
    await notif.save();
  }
  return { success: true };
}
