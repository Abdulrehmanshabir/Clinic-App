"use client";

import React, { useState } from "react";
import {
  Coffee,
  Sparkles,
  Clock,
  Loader2,
  Check,
  X,
  MessageSquare,
} from "lucide-react";

interface DoctorBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreak: (breakType: string, customReason?: string) => Promise<void>;
  isLoading: boolean;
}

const BREAK_OPTIONS = [
  {
    id: "Tea Break",
    label: "Tea Break",
    icon: Coffee,
  },
  {
    id: "Namaz Break",
    label: "Namaz Break",
    icon: Sparkles,
  },
  {
    id: "Clinic Break",
    label: "Clinic Break",
    icon: Clock,
  },
];

export function DoctorBreakModal({
  isOpen,
  onClose,
  onStartBreak,
  isLoading,
}: DoctorBreakModalProps) {
  const [selectedType, setSelectedType] = useState<string>("Tea Break");
  const [customReason, setCustomReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onStartBreak(selectedType, customReason.trim() ? customReason : undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A120B]/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg bg-[#FCFAF6] dark:bg-[#0B1120] border-2 border-[#8C6843]/40 dark:border-[#D4AF37]/60 rounded-3xl shadow-2xl shadow-[#1A120B]/25 dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Aesthetic Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#E8DFD1] dark:border-[#243248] bg-[#F7F3EB]/70 dark:bg-[#131B2A]/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#8C6843] text-white dark:bg-[#D4AF37] dark:text-[#12100E] flex items-center justify-center shrink-0 shadow-sm shadow-[#8C6843]/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-[#1A120B] dark:text-[#FFFFFF] tracking-tight">
                Take Break
              </h3>
              <p className="text-sm text-[#8C6843] dark:text-[#E5C158] font-bold mt-0.5">
                Select break type to update reception status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8C7A6B] hover:text-[#1A120B] hover:bg-[#EAE1D3] dark:text-[#94A3B8] dark:hover:text-white dark:hover:bg-[#1A2438] transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Aesthetic & Clean */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[#FCFAF6] dark:bg-[#0B1120]">
          {/* 3 Aesthetic Break Cards */}
          <div className="grid grid-cols-3 gap-3.5">
            {BREAK_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedType(opt.id)}
                  className={`py-5 px-3 rounded-2xl border-2 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 cursor-pointer relative hover:-translate-y-0.5 active:scale-[0.98] ${
                    isSelected
                      ? "bg-[#FAF5EE] border-[#8C6843] text-[#8C6843] shadow-md shadow-[#8C6843]/15 ring-2 ring-[#8C6843]/20 dark:bg-[#1A2438] dark:border-[#D4AF37] dark:text-[#D4AF37] dark:shadow-[0_4px_20px_rgba(212,175,55,0.2)] dark:ring-2 dark:ring-[#D4AF37]/30"
                      : "bg-white hover:bg-[#FAF7F2] border-[#E8DFD1] hover:border-[#8C6843]/50 text-[#1A120B] dark:bg-[#131B2A] dark:hover:bg-[#1A2438] dark:border-[#243248] dark:hover:border-[#334155] dark:text-[#CBD5E1]"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#8C6843] dark:bg-[#D4AF37] text-white dark:text-[#12100E] flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#8C6843] text-white shadow-sm dark:bg-[#D4AF37] dark:text-[#12100E]"
                        : "bg-[#F4EFE6] text-[#8C6843] dark:bg-[#0E1626] dark:text-[#94A3B8]"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Minimal Note Input with Label */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5C4D3E] dark:text-[#CBD5E1]">
              Note for Front Desk (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B] dark:text-[#64748B]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Add optional note for receptionist..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#131B2A] border-2 border-[#E8DFD1] dark:border-[#243248] text-xs sm:text-sm text-[#1A120B] dark:text-[#F8FAFC] placeholder-[#8C7A6B]/70 dark:placeholder-[#64748B] focus:outline-none focus:border-[#8C6843] dark:focus:border-[#D4AF37] transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t-2 border-[#E8DFD1] dark:border-[#243248]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border-2 border-[#D8C5AD] dark:border-[#2D3E58] bg-[#FAF7F2] hover:bg-[#EAE1D3] dark:bg-[#131B2A] dark:hover:bg-[#1A2438] text-[#5C4D3E] dark:text-[#CBD5E1] text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-[#8C6843] hover:bg-[#745534] text-white dark:bg-[#D4AF37] dark:hover:bg-[#C5A059] dark:text-[#12100E] font-bold text-xs sm:text-sm shadow-md shadow-[#8C6843]/20 dark:shadow-[0_4px_16px_rgba(212,175,55,0.25)] border-2 border-[#745534] dark:border-[#E5C158] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Coffee className="w-4 h-4" />
                  <span>Start Break</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
