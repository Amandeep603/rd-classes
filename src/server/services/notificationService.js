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
        type: "device_request",
        entityId: entityId.toString(),
        readAt: null,
      });
      if (existingUnread) {
        return existingUnread;
      }
    }

    const doc = await Notification.create({
      type,
      title,
      message,
      link,
      entityId: entityId ? entityId.toString() : null,
      readAt: null,
    });

    return doc;
  } catch (err) {
    console.error("[NotificationService] Error creating notification:", err);
    return null;
  }
}

/**
 * Fetch latest 20 notifications + unread count.
 */
export async function getAdminNotifications(limit = 20) {
  await connectDB();
  const [notifications, unreadCount] = await Promise.all([
    Notification.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ readAt: null }),
  ]);

  return { notifications, unreadCount };
}

/**
 * Mark one or all notifications as read.
 */
export async function markNotificationsAsRead({ notificationId = null, markAll = false } = {}) {
  await connectDB();
  const now = new Date();

  if (markAll) {
    const res = await Notification.updateMany(
      { readAt: null },
      { $set: { readAt: now } }
    );
    return { success: true, count: res.modifiedCount };
  }

  if (notificationId) {
    const res = await Notification.updateOne(
      { _id: notificationId, readAt: null },
      { $set: { readAt: now } }
    );
    return { success: true, count: res.modifiedCount };
  }

  return { success: false, error: "Missing parameters" };
}
