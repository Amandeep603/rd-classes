import { connection } from "next/server";
import { redirect } from "next/navigation";

export const instant = false;

export default async function StudentCourseLectureWatchRedirect({ params }) {
  await connection();
  const { lectureId } = await params;
  redirect(`/student/watch/${lectureId}`);
}
