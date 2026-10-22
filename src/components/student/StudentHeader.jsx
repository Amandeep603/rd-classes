"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, User, LogOut } from "lucide-react";
import { logoutStudentAction } from "@/server/actions/auth.actions.js";

export default function StudentHeader({ user }) {
  return (
    <header className="w-full bg-[#111113] border-b border-[#222225] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/student" className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-md">
              <Image
                src="/images/logo-rd.png"
                alt="RD Classes"
                width={36}
                height={24}
                className="h-6 w-auto"
              />
            </div>
            <span className="font-bold text-white text-base tracking-tight hidden sm:inline">
              RD Classes <span className="text-[#FFB800] text-xs font-medium ml-1">PORTAL</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <Link
              href="/student"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1A1A1E] transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#FFB800]" />
              <span>My Courses</span>
            </Link>
            <Link
              href="/student/account"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1A1A1E] transition-colors"
            >
              <User className="w-4 h-4 text-gray-400" />
              <span>Account</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:block text-right">
              <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{user.loginId}</p>
            </div>
          )}

          <form action={logoutStudentAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-red-400 hover:bg-[#1C1616] rounded-lg transition-colors border border-transparent hover:border-red-950/40"
              title="Logout from this device"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
