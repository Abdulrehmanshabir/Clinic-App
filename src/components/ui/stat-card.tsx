import React from "react";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "default" | "amber" | "indigo" | "emerald" | "rose" | "sky" | "bronze";
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
  dark?: boolean;
  theme?: "default" | "dark" | "stone";
}

const variantStyles = {
  default: "bg-[#FFFFFF] border-2 border-[#E8DFD1] text-[#1E1915] hover:border-[#8C6843] stat-card-default",
  amber: "bg-[#FFFBF5] border-2 border-[#F2DEBA] text-[#9A6B27] hover:border-[#D9A54C] stat-card-amber",
  indigo: "bg-[#FDFBFC] border-2 border-[#E8DCE5] text-[#6A3D68] hover:border-[#9C6599] stat-card-indigo",
  emerald: "bg-[#F8FAF8] border-2 border-[#15803D] text-[#15803D] hover:border-[#166534] stat-card-emerald",
  rose: "bg-[#FFF9F9] border-2 border-[#DC2626] text-[#DC2626] hover:border-[#B91C1C] stat-card-rose",
  sky: "bg-[#F8FAFC] border-2 border-[#0284C7] text-[#0284C7] hover:border-[#0369A1] stat-card-sky",
  bronze: "bg-[#FAF7F2] border-2 border-[#8C6843] text-[#8C6843] hover:border-[#A8835A] stat-card-bronze",
};

const stoneVariantStyles = {
  default: "bg-[#F5F2EB] border-2 border-[#D8D0C5] text-[#111111] hover:border-[#111111]",
  amber: "bg-[#FAF6EE] border-2 border-[#DDD3C2] text-[#8C6226] hover:border-[#8C6226]",
  indigo: "bg-[#F7F3EE] border-2 border-[#D8CCC1] text-[#4A3D4D] hover:border-[#111111]",
  emerald: "bg-[#F3F6F2] border-2 border-[#C8D6C7] text-[#245930] hover:border-[#245930]",
  rose: "bg-[#FAF3F3] border-2 border-[#DC2626] text-[#DC2626] hover:border-[#B91C1C]",
  sky: "bg-[#F2F5F8] border-2 border-[#CAD5DE] text-[#234B6E] hover:border-[#234B6E]",
  bronze: "bg-[#F5F1EB] border-2 border-[#D5C9BC] text-[#111111] hover:border-[#111111]",
};

const stoneIconBgStyles = {
  default: "bg-[#111111] text-[#F5F2EB] border border-[#111111]",
  amber: "bg-[#EFE5D3] text-[#8C6226] border border-[#DDD3C2]",
  indigo: "bg-[#E8DEE3] text-[#4A3D4D] border border-[#D5C6CF]",
  emerald: "bg-[#E1EDE0] text-[#245930] border border-[#C5DAC3]",
  rose: "bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]",
  sky: "bg-[#E0EBF3] text-[#234B6E] border border-[#C6D8E5]",
  bronze: "bg-[#111111] text-[#EFECE6] border border-[#111111]",
};

const iconBgStyles = {
  default: "bg-[#F4EFE6] text-[#4A3522] border border-[#E9DFD1] stat-icon-default",
  amber: "bg-[#FEF3D6] text-[#B45309] border border-[#FDE68A] stat-icon-amber",
  indigo: "bg-[#F5E8F3] text-[#7E22CE] border border-[#E9D5FF] stat-icon-indigo",
  emerald: "bg-[#E6F4EA] text-[#15803D] border-2 border-[#15803D] stat-icon-emerald",
  rose: "bg-[#FEE2E2] text-[#DC2626] border-2 border-[#DC2626] stat-icon-rose",
  sky: "bg-[#E0F2FE] text-[#0284C7] border-2 border-[#0284C7] stat-icon-sky",
  bronze: "bg-[#F3E8DB] text-[#8C6843] border-2 border-[#8C6843] stat-icon-bronze",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
  onClick,
  active = false,
  theme = "default",
}: StatCardProps) {
  const isStone = theme === "stone";

  const currentStyles = isStone
    ? stoneVariantStyles[variant] || stoneVariantStyles.default
    : variantStyles[variant] || variantStyles.default;

  const currentIconBg = isStone
    ? stoneIconBgStyles[variant] || stoneIconBgStyles.default
    : iconBgStyles[variant] || iconBgStyles.default;

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl border-2 transition-all duration-200 aesthetic-card-shadow ${
        currentStyles
      } ${onClick ? "cursor-pointer select-none aesthetic-card-hover" : ""} ${
        active 
          ? isStone
            ? "ring-2 ring-[#111111] border-[#111111] shadow-lg shadow-[#111111]/20"
            : `ring-2 ring-current shadow-md stat-card-active-${variant}` 
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-base sm:text-lg font-bold tracking-tight stat-card-title ${
            isStone ? "text-[#111111]" : ""
          }`}>
            {title}
          </p>
          <p className={`text-[25px] font-black mt-1 tracking-tight leading-none stat-card-value ${
            isStone ? "text-[#111111]" : ""
          }`}>{value}</p>
          {subtitle && <p className={`text-xs mt-1 font-bold ${
            isStone ? "text-[#4A453E]" : "text-[#6B5E51]"
          }`}>{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${currentIconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
