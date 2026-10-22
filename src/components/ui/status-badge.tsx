import React from "react";
import { type AppointmentStatus } from "@/types/database";
import {
  Clock,
  PhoneCall,
  Stethoscope,
  CheckCircle2,
  XCircle,
  UserX,
} from "lucide-react";

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  AppointmentStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
  }
> = {
  waiting: {
    label: "Waiting",
    bg: "bg-[#FAF7F2] dark:bg-[#1A2230]",
    text: "text-[#B45309] dark:text-[#FBBF24]",
    border: "border-2 border-[#F59E0B] dark:border-[#FBBF24]",
    icon: Clock,
    iconColor: "text-[#B45309] dark:text-[#FBBF24]",
  },
  called: {
    label: "Called",
    bg: "bg-[#FAF7F2] dark:bg-[#1A2230]",
    text: "text-[#0284C7] dark:text-[#38BDF8]",
    border: "border-2 border-[#0284C7] dark:border-[#38BDF8]",
    icon: PhoneCall,
    iconColor: "text-[#0284C7] dark:text-[#38BDF8]",
  },
  in_consultation: {
    label: "In Consultation",
    bg: "bg-[#FAF7F2] dark:bg-[#1A2230]",
    text: "text-[#7E22CE] dark:text-[#C084FC]",
    border: "border-2 border-[#7E22CE] dark:border-[#C084FC]",
    icon: Stethoscope,
    iconColor: "text-[#7E22CE] dark:text-[#C084FC]",
  },
  completed: {
    label: "Completed",
    bg: "bg-[#FAF7F2] dark:bg-[#1A2230]",
    text: "text-[#15803D] dark:text-[#34D399]",
    border: "border-2 border-[#15803D] dark:border-[#34D399]",
    icon: CheckCircle2,
    iconColor: "text-[#15803D] dark:text-[#34D399]",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-[#FAF7F2] dark:bg-[#1A2230]",
    text: "text-[#DC2626] dark:text-[#FB7185]",
    border: "border-2 border-[#DC2626] dark:border-[#FB7185]",
    icon: XCircle,
    iconColor: "text-[#DC2626] dark:text-[#FB7185]",
  },
  no_show: {
    label: "Not Present",
    bg: "bg-[#FAF7F2] dark:bg-[#1A2230]",
    text: "text-[#DC2626] dark:text-[#FB7185]",
    border: "border-2 border-[#DC2626] dark:border-[#FB7185]",
    icon: UserX,
    iconColor: "text-[#DC2626] dark:text-[#FB7185]",
  },
};

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    bg: "bg-[#FAF7F2] dark:bg-[#1A2230]",
    text: "text-[#6B5E51] dark:text-[#94A3B8]",
    border: "border-2 border-[#E9DFD1] dark:border-[#2D3E58]",
    icon: Clock,
    iconColor: "text-[#6B5E51] dark:text-[#94A3B8]",
  };

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs gap-1.5 font-bold",
    md: "px-3.5 py-1 text-xs gap-1.5 font-black",
    lg: "px-4 py-1.5 text-sm gap-2 font-black",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-xl shadow-2xs whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${sizeStyles[size]} ${className}`}
    >
      <Icon className={`${iconSizes[size]} ${config.iconColor} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}
