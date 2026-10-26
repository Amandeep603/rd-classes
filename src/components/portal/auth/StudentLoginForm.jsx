"use client";

import { loginStudentAction } from "@/server/actions/auth.actions.js";
import AuthScene from "./AuthScene";

export default function StudentLoginForm() {
  return <AuthScene role="student" action={loginStudentAction} />;
}
