import { connection } from "next/server";
import { redirect } from "next/navigation";

export const instant = false;

export default async function StudentCourseSlugRedirect({ params }) {
  await connection();
  const { slug } = await params;
  redirect(`/student/lectures/${slug}`);
}
