"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ showLabel = true }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid layout shift before mount
  if (!mounted) {
    return (
      <div className="w-9 h-9 sm:w-24 h-9 rounded-2xl bg-[#F4EFE6] dark:bg-[#162238] border border-[#E9DFD1] dark:border-[#2A3B54] opacity-50" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Blue Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`group relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl transition-all duration-200 border shadow-xs select-none ${
        isDark
          ? "bg-[#162238] hover:bg-[#1E2D48] text-[#F8FAFC] border-[#2A3B54] hover:border-[#38BDF8]/60"
          : "bg-[#F4EFE6] hover:bg-[#EAE1D3] text-[#4A3522] border-[#E9DFD1] hover:border-[#D8C5AD]"
      }`}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-[#FBBF24] transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-[#A8835A] transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-bold tracking-wide hidden sm:inline">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
