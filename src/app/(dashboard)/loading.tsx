import React from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#E9DFD1] rounded-xl" />
          <div className="h-4 w-72 bg-[#EFE6D8] rounded-lg" />
        </div>
        <div className="flex items-center gap-2 text-[#8C6843]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>

      {/* KPI Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1] space-y-3">
            <div className="h-4 w-20 bg-[#EFE6D8] rounded-md" />
            <div className="h-8 w-14 bg-[#E9DFD1] rounded-xl" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="p-7 rounded-3xl bg-[#FAF7F2] border border-[#E8DFD1] space-y-4">
        <div className="h-6 w-40 bg-[#E9DFD1] rounded-lg" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full bg-[#F4EFE6] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
