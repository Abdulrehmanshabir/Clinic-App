import React from "react";
import { ModalCloseButton } from "@/components/ui/modal-close-button";

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
              {subtitle && <p className="text-sm text-[#8C6843] dark:text-[#E5C158] font-bold mt-1">{subtitle}</p>}
            </div>
            <ModalCloseButton onClick={onClose} />
          </div>
        )}
        <div className={`${hideDefaultHeader ? "p-0" : "p-4 sm:p-7"} overflow-y-auto flex-1 custom-scrollbar`}>{children}</div>
      </div>
    </div>
  );
}
