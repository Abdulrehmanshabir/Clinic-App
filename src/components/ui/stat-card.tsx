import React from "react";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "default" | "amber" | "indigo" | "emerald" | "rose" | "sky" | "bronze" | "red" | "orange" | "purple" | "violet" | "teal" | "jade";
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
  dark?: boolean;
  theme?: "default" | "dark" | "stone";
}

const variantStyles: Record<string, string> = {
  default: "bg-[#EA580C] border-2 border-[#9A3412] text-white hover:border-[#FB923C] stat-card-default shadow-sm",
  bronze: "bg-[#EA580C] border-2 border-[#9A3412] text-white hover:border-[#FB923C] stat-card-bronze shadow-sm",
  orange: "bg-[#EA580C] border-2 border-[#9A3412] text-white hover:border-[#FB923C] stat-card-orange shadow-sm",
  amber: "bg-[#DC2626] border-2 border-[#991B1B] text-white hover:border-[#EF4444] stat-card-amber shadow-sm",
  rose: "bg-[#DC2626] border-2 border-[#991B1B] text-white hover:border-[#EF4444] stat-card-rose shadow-sm",
  red: "bg-[#DC2626] border-2 border-[#991B1B] text-white hover:border-[#EF4444] stat-card-red shadow-sm",
  indigo: "bg-[#4F46E5] border-2 border-[#3730A3] text-white hover:border-[#818CF8] stat-card-indigo shadow-sm",
  sky: "bg-[#0284C7] border-2 border-[#075985] text-white hover:border-[#38BDF8] stat-card-sky shadow-sm",
  emerald: "bg-[#15803D] border-2 border-[#14532D] text-white hover:border-[#34D399] stat-card-emerald shadow-sm",
  purple: "bg-[#7C3AED] border-2 border-[#5B21B6] text-white hover:border-[#A78BFA] stat-card-purple shadow-sm",
  violet: "bg-[#7C3AED] border-2 border-[#5B21B6] text-white hover:border-[#A78BFA] stat-card-violet shadow-sm",
  teal: "bg-[#0D9488] border-2 border-[#115E59] text-white hover:border-[#2DD4BF] stat-card-teal shadow-sm",
  jade: "bg-[#059669] border-2 border-[#065F46] text-white hover:border-[#34D399] stat-card-jade shadow-sm",
};

const stoneVariantStyles: Record<string, string> = {
  default: "bg-[#F5F2EB] border-2 border-[#D8D0C5] text-[#111111] hover:border-[#111111]",
  bronze: "bg-[#F5F1EB] border-2 border-[#D5C9BC] text-[#111111] hover:border-[#111111]",
  red: "bg-[#FAF3F3] border-2 border-[#DC2626] text-[#DC2626] hover:border-[#B91C1C]",
  amber: "bg-[#FAF6EE] border-2 border-[#DDD3C2] text-[#8C6226] hover:border-[#8C6226]",
  indigo: "bg-[#F7F3EE] border-2 border-[#D8CCC1] text-[#4A3D4D] hover:border-[#111111]",
  emerald: "bg-[#F3F6F2] border-2 border-[#C8D6C7] text-[#245930] hover:border-[#245930]",
  rose: "bg-[#FAF3F3] border-2 border-[#DC2626] text-[#DC2626] hover:border-[#B91C1C]",
  orange: "bg-[#FAF6EE] border-2 border-[#EA580C] text-[#C2410C] hover:border-[#9A3412]",
  sky: "bg-[#F2F5F8] border-2 border-[#CAD5DE] text-[#234B6E] hover:border-[#234B6E]",
  purple: "bg-[#F5F3FF] border-2 border-[#DDD6FE] text-[#6D28D9] hover:border-[#7C3AED]",
  violet: "bg-[#F5F3FF] border-2 border-[#DDD6FE] text-[#6D28D9] hover:border-[#7C3AED]",
  teal: "bg-[#F0FDFA] border-2 border-[#CCFBF1] text-[#0F766E] hover:border-[#0D9488]",
  jade: "bg-[#ECFDF5] border-2 border-[#A7F3D0] text-[#047857] hover:border-[#059669]",
};

const stoneIconBgStyles: Record<string, string> = {
  default: "bg-[#111111] text-[#F5F2EB] border border-[#111111]",
  bronze: "bg-[#111111] text-[#EFECE6] border border-[#111111]",
  red: "bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]",
  amber: "bg-[#EFE5D3] text-[#8C6226] border border-[#DDD3C2]",
  indigo: "bg-[#E8DEE3] text-[#4A3D4D] border border-[#D5C6CF]",
  emerald: "bg-[#E1EDE0] text-[#245930] border border-[#C5DAC3]",
  rose: "bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]",
  orange: "bg-[#FFEDD5] text-[#EA580C] border border-[#FB923C]",
  sky: "bg-[#E0EBF3] text-[#234B6E] border border-[#C6D8E5]",
  purple: "bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]",
  violet: "bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]",
  teal: "bg-[#CCFBF1] text-[#0D9488] border border-[#99F6E4]",
  jade: "bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]",
};

const iconBgStyles: Record<string, string> = {
  default: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-default",
  bronze: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-bronze",
  red: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-red",
  amber: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-amber",
  rose: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-rose",
  orange: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-orange",
  indigo: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-indigo",
  sky: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-sky",
  emerald: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-emerald",
  purple: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-purple",
  violet: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-violet",
  teal: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-teal",
  jade: "bg-white/20 text-white border border-white/30 backdrop-blur-sm stat-icon-jade",
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
            ? "shadow-lg shadow-[#111111]/20 scale-[1.02]"
            : "shadow-xl scale-[1.02]"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-base sm:text-lg font-bold tracking-tight stat-card-title ${
            isStone ? "text-[#111111]" : "text-white"
          }`}>
            {title}
          </p>
          <p className={`text-[25px] font-black mt-1 tracking-tight leading-none stat-card-value ${
            isStone ? "text-[#111111]" : "text-white"
          }`}>{value}</p>
          {subtitle && <p className={`text-xs mt-1 font-bold ${
            isStone ? "text-[#4A453E]" : "text-white/80"
          }`}>{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl flex items-center justify-center ${currentIconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
