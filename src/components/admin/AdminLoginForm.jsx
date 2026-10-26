"use client";

import { loginAdminAction } from "@/server/actions/auth.actions.js";
import AuthScene from "@/components/portal/auth/AuthScene";

export default function AdminLoginForm() {
  return <AuthScene role="admin" action={loginAdminAction} />;
}
