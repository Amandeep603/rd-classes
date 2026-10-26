"use client";

import { loginAdminAction } from "@/server/actions/auth.actions.js";
import AuthScene from "./AuthScene";

export default function AdminLoginForm() {
  return <AuthScene role="admin" action={loginAdminAction} />;
}
