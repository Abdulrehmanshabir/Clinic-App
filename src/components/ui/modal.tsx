import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  hideDefaultHeader?: boolean;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title = "",
  subtitle,
  children,
  maxWidth = "lg",
  hideDefaultHeader = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1A120B]/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidthMap[maxWidth]} bg-[#FCFAF6] dark:bg-[#121824] border border-[#E8DFD1] dark:border-[#243248] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#1E1915] dark:text-[#FAF7F2]`}
      >
        {!hideDefaultHeader && (
          <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-[#E8DFD1] dark:border-[#243248] bg-[#F7F3EB]/60 dark:bg-[#151D2A]">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A120B] dark:text-[#FAF7F2] tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs text-[#8C7A6B] dark:text-[#94A3B8] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8C7A6B] dark:text-[#94A3B8] hover:text-[#1A120B] dark:hover:text-white hover:bg-[#EAE1D3] dark:hover:bg-[#1E293B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className={`${hideDefaultHeader ? "p-0" : "p-4 sm:p-7"} overflow-y-auto flex-1 custom-scrollbar`}>{children}</div>
      </div>
    </div>
  );
}
