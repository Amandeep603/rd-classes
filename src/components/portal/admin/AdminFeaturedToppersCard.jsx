"use client";

import Link from "next/link";
import Image from "next/image";
import { Award, ArrowRight, Plus } from "lucide-react";

export default function AdminFeaturedToppersCard({ toppers = [], error = null }) {
  if (error) {
    return (
      <div className="rounded-[22px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-rose-200">
        <div className="flex items-center gap-2.5 text-rose-600 mb-2">
          <Award className="h-5 w-5" />
          <h2 className="text-base font-extrabold">Featured Toppers</h2>
        </div>
        <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Award className="h-5 w-5" />
          </div>
          <h2 className="text-base font-extrabold text-[#111827]">
            Featured Toppers
          </h2>
        </div>
        <Link
          href="/admin/toppers"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
        >
          <span>Manage</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List or Empty State */}
      {toppers.length > 0 ? (
        <div className="divide-y divide-black/5">
          {toppers.map((topper) => {
            const marksDisplay = topper.marks || topper.score || "90+";
            return (
              <div
                key={topper._id || topper.name}
                className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-black/10 bg-amber-50">
                    {topper.photoUrl || topper.photo ? (
                      <Image
                        src={topper.photoUrl || topper.photo}
                        alt={topper.name}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-amber-800 text-sm">
                        {topper.name?.charAt(0) || "T"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#111827] truncate">
                      {topper.name}
                    </div>
                    <div className="text-xs text-[#6B7280] truncate">
                      {topper.school}
                      {topper.year && ` • ${topper.year}`}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-3 flex h-8 min-w-[36px] items-center justify-center rounded-lg bg-[#FFF8E6] px-2 text-xs font-black text-[#B47500] border border-[#FFE59E]">
                  {marksDisplay}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/10 bg-[#FBF8F1]/50 p-6 text-center">
          <Award className="mx-auto h-8 w-8 text-amber-500/60 mb-2" />
          <p className="text-xs font-bold text-[#374151]">No featured toppers added yet</p>
          <p className="mt-0.5 text-[11px] text-[#6B7280]">
            Feature top board scorers to showcase on the dashboard and homepage.
          </p>
          <Link
            href="/admin/toppers"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#E5AE17] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Topper</span>
          </Link>
        </div>
      )}
    </div>
  );
}
