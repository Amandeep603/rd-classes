import { connection } from "next/server";
import { redirect } from "next/navigation";

export const instant = false;

export default async function StudentCoursesRedirect() {
  await connection();
  redirect("/student/lectures");
}
