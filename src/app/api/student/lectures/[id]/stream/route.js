import { getStudentAuthStatus } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { Enrollment } from "@/lib/models/Enrollment";
import { Device } from "@/lib/models/Device";
import { LectureProgress } from "@/lib/models/LectureProgress";
import { isLectureFree } from "@/server/services/lectureService.js";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: "Missing lecture ID" }, { status: 400 });
    }

    await connectDB();

    const lecture = await Lecture.findById(id).lean();
    if (!lecture || (!lecture.published && lecture.status !== "published")) {
      return Response.json({ error: "Lecture not found" }, { status: 404 });
    }

    // Fetch all course lectures to evaluate isLectureFree rule
    const allCourseLectures = await Lecture.find({
      courseId: lecture.courseId,
      published: true,
    }).lean();

    const isFree = isLectureFree(lecture, allCourseLectures);

    // Check student authentication status (non-blocking)
    const studentAuth = await getStudentAuthStatus();
    const user = studentAuth.authenticated ? studentAuth.user : null;
    const session = studentAuth.authenticated ? studentAuth.session : null;

    // Case 1: Free preview lecture
    if (isFree) {
      let progress = null;
      if (user) {
        progress = await LectureProgress.findOne({
          $or: [
            { studentId: user._id, lectureId: lecture._id },
            { userId: user._id, lectureId: lecture._id },
          ],
        }).lean();
      }

      return Response.json({
        success: true,
        stream: {
          id: lecture._id.toString(),
          title: lecture.title,
          chapter: lecture.chapter || lecture.section || "",
          book: lecture.book || "",
          duration: lecture.durationSeconds || lecture.durationSec || 0,
          videoUrl: lecture.videoUrl || "",
          videoProvider: lecture.videoProvider || (lecture.vimeoId ? "vimeo" : "hls"),
          vimeoId: lecture.vimeoId || "",
          vimeoHash: lecture.vimeoHash || "",
          durationSeconds: lecture.durationSeconds || lecture.durationSec || 0,
          lastWatchedSeconds: progress?.watchedSeconds || progress?.positionSec || 0,
          completed: Boolean(progress?.completed),
          isFree: true,
          locked: false,
        },
        watermark: user
          ? { name: user.name, loginId: user.loginId }
          : { name: "RD Classes Preview", loginId: "" },
      });
    }

    // Case 2: Locked lecture - strictly server-enforced access
    if (!user || user.role !== "student") {
      return Response.json(
        {
          error: "Forbidden. This lecture is locked. Please log in with an enrolled account.",
          isFree: false,
          locked: true,
        },
        { status: 403 }
      );
    }

    // 2a. Verify Approved Device
    if (session?.deviceId) {
      const device = await Device.findOne({
        $or: [{ studentId: user._id }, { userId: user._id }],
        deviceId: session.deviceId,
        status: "approved",
      }).lean();

      if (!device) {
        return Response.json(
          {
            error: "Access denied. This device is not approved.",
            isFree: false,
            locked: true,
          },
          { status: 403 }
        );
      }
    }

    // 2b. Verify Active Enrollment in this course
    const now = new Date();
    const enrollment = await Enrollment.findOne({
      $or: [
        { studentId: user._id, courseId: lecture.courseId, status: "active" },
        { userId: user._id, courseId: lecture.courseId, status: "active" },
      ],
      $and: [
        {
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        },
      ],
    }).lean();

    if (!enrollment) {
      return Response.json(
        {
          error: "Access denied. You are not actively enrolled in this course.",
          isFree: false,
          locked: true,
        },
        { status: 403 }
      );
    }

    // 2c. Fetch Student's last watched progress
    const progress = await LectureProgress.findOne({
      $or: [
        { studentId: user._id, lectureId: lecture._id },
        { userId: user._id, lectureId: lecture._id },
      ],
    }).lean();

    return Response.json({
      success: true,
      stream: {
        id: lecture._id.toString(),
        title: lecture.title,
        chapter: lecture.chapter || lecture.section || "",
        book: lecture.book || "",
        duration: lecture.durationSeconds || lecture.durationSec || 0,
        videoUrl: lecture.videoUrl || "",
        videoProvider: lecture.videoProvider || (lecture.vimeoId ? "vimeo" : "hls"),
        vimeoId: lecture.vimeoId || "",
        vimeoHash: lecture.vimeoHash || "",
        durationSeconds: lecture.durationSeconds || lecture.durationSec || 0,
        lastWatchedSeconds: progress?.watchedSeconds || progress?.positionSec || 0,
        completed: Boolean(progress?.completed),
        isFree: false,
        locked: false,
      },
      watermark: {
        name: user.name,
        loginId: user.loginId,
      },
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to load stream." },
      { status: 500 }
    );
  }
}
