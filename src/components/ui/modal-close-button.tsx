"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalCloseButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function ModalCloseButton({
  onClick,
  disabled = false,
  className,
  ariaLabel = "Close",
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center text-[#8C7A6B] hover:text-[#1A120B] hover:bg-[#EAE1D3] dark:text-[#94A3B8] dark:hover:text-white dark:hover:bg-[#1A2438] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <X className="w-5 h-5" />
    </button>
  );
}
