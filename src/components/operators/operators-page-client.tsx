"use client";

import React, { useState } from "react";
import { type ClinicSettings, type Profile } from "@/types/database";
import { createOperatorUser, toggleOperatorStatus, deleteOperatorUser } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { UserCog, UserPlus, CheckCircle2, XCircle, Loader2, Trash2, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { operatorSchema } from "@/lib/validations";
import { z } from "zod";
import { useRouter } from "next/navigation";

type OperatorFormData = z.infer<typeof operatorSchema>;

interface OperatorsPageClientProps {
  initialOperators: Profile[];
  clinicSettings?: ClinicSettings | null;
  clinicDate: string;
}

export function OperatorsPageClient({
  initialOperators,
  clinicSettings,
  clinicDate,
}: OperatorsPageClientProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      role: "operator",
      is_active: true,
    },
  });

  const onSubmit = async (data: OperatorFormData) => {
    setLoading(true);
    try {
      const res = await createOperatorUser(data);
      if (res.success) {
        success("Staff Account Created", `Account for ${data.email} is ready`);
        setIsModalOpen(false);
        reset();
        router.refresh();
      } else {
        error("Creation Failed", res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (profileId: string, currentStatus: boolean) => {
    try {
      const res = await toggleOperatorStatus(profileId, !currentStatus);
      if (res.success) {
        success(`Staff account ${!currentStatus ? "activated" : "deactivated"}`);
        router.refresh();
      } else {
        error("Failed", res.error);
      }
    } catch {
      error("Error", "Could not toggle status");
    }
  };

  const handleDelete = async (profileId: string, staffName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${staffName}"? Their consultations and appointments will be moved to the head doctor. This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(profileId);
    try {
      const res = await deleteOperatorUser(profileId);
      if (res.success) {
        success("Staff Member Deleted", `Account for ${staffName} has been removed.`);
        router.refresh();
      } else {
        error("Delete Failed", res.error);
      }
    } catch {
      error("Error", "Could not delete staff member");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#FCFAF6] border border-[#E8DFD1] aesthetic-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A120B] tracking-tight">
            Staff & Operator Accounts
          </h2>
          <p className="text-xs text-[#8C7A6B] mt-1 font-medium">
            Manage front desk operator logins, grant reception queue permissions, and account access status.
          </p>
        </div>

        <button
          onClick={() => {
            reset({ role: "operator", is_active: true });
            setIsModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] font-bold text-xs tracking-wide shadow-md shadow-[#1E1915]/15 transition-all duration-200 flex items-center gap-2 border border-[#2B1E14]"
        >
          <UserPlus className="w-4 h-4 text-[#D8C5AD]" />
          <span>+ Create Operator</span>
        </button>
      </div>

      {/* Operators List */}
      <div className="rounded-3xl border border-[#E8DFD1] bg-[#FCFAF6] overflow-hidden aesthetic-card-shadow">
        <div className="px-7 py-5 border-b border-[#E8DFD1] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A120B]">
              Registered Staff & Operators
            </h3>
            <span className="text-xs font-bold text-[#1A120B] bg-[#F4EFE6] px-3.5 py-1.5 rounded-xl border border-[#E9DFD1] shadow-2xs">
              {initialOperators.length} Members
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-[#1E1915]">
            <thead className="bg-[#F4EFE6] text-lg font-black tracking-wider text-[#1A120B] border-b border-[#E8DFD1]">
              <tr>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Staff Name</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Email</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Role</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Status</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE6D8]">
              {initialOperators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-[#8C7A6B]">
                    <div className="max-w-sm mx-auto space-y-1.5 py-2">
                      <p className="font-bold text-lg text-[#1A120B]">No staff accounts found</p>
                      <p className="text-sm text-[#8C7A6B]">Click &quot;+ Create Operator&quot; to provision staff access.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialOperators.map((op) => (
                  <tr key={op.id} className="hover:bg-[#F7F3EB]/50 transition-colors duration-150">
                    <td className="px-6 py-4 text-center font-bold text-[#1A120B] text-base font-serif">
                      {op.full_name}
                    </td>
                    <td className="px-6 py-4 text-center text-[#1A120B] text-base font-mono font-bold">
                      <span className="bg-[#F4EFE6] px-3.5 py-1.5 rounded-xl border border-[#E9DFD1] inline-block shadow-2xs">
                        {op.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center capitalize">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] text-[#6B4E31] border border-[#D8C5AD] text-sm font-bold shadow-2xs">
                        <UserCog className="w-4 h-4 text-[#A8835A]" />
                        {op.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {op.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E6F4EA] text-[#15803D] border border-[#BBF7D0] text-xs font-bold shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-xs font-bold shadow-2xs">
                          <XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggle(op.id, op.is_active)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                            op.is_active
                              ? "bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]"
                              : "bg-[#E6F4EA] hover:bg-[#D4EDDA] text-[#15803D] border border-[#BBF7D0]"
                          }`}
                        >
                          {op.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(op.id, op.full_name)}
                          disabled={deletingId === op.id}
                          title="Delete staff account permanently"
                          className="p-2 rounded-xl text-[#B91C1C] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECACA] transition duration-150 disabled:opacity-50"
                        >
                          {deletingId === op.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#B91C1C]" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Operator / Staff Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hideDefaultHeader={true}
        maxWidth="md"
      >
        <div className="p-5 sm:p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#D8C5AD] text-left max-w-md mx-auto shadow-xl relative">
          <ModalCloseButton
            onClick={() => setIsModalOpen(false)}
            className="absolute right-3.5 top-3.5"
          />

          {/* Header: Clinic Branding */}
          <div className="text-center border-b border-dashed border-[#D8C5AD] pb-2.5">
            <h5 className="font-serif font-black text-base tracking-wider text-[#1A120B] uppercase">
              {clinicSettings?.clinic_name || "Glow Derm"}
            </h5>
            <p className="text-sm text-[#5C4D3E] font-bold mt-0.5">
              Staff Account Setup
            </p>
            <p className="text-xs sm:text-sm text-[#1A120B] font-mono font-black mt-1">
              {clinicDate}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="py-2.5 space-y-3.5 max-w-[350px] mx-auto w-full">
              <div>
                <label className="block text-sm sm:text-base font-bold text-[#8C6843] dark:text-[#E5C158] mb-1.5 ml-3">
                  Full Name
                </label>
                <input
                  {...register("full_name")}
                  type="text"
                  placeholder="Enter full name"
                  autoComplete="off"
                  className="w-full h-11 px-4 py-2 rounded-xl bg-[#FFFFFF] border-2 border-[#BCA58C] dark:border-[#2D3E58] text-[#1A120B] dark:text-[#FAF7F2] placeholder-soft focus:outline-none focus:border-[#8C6843] dark:focus:border-[#E5C158] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold transition shadow-2xs"
                />
                {errors.full_name && (
                  <p className="text-xs text-[#B91C1C] mt-1 ml-1 font-bold">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-[#8C6843] dark:text-[#E5C158] mb-1.5 ml-3">
                  Staff Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Enter staff email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  className="w-full h-11 px-4 py-2 rounded-xl bg-[#FFFFFF] border-2 border-[#BCA58C] dark:border-[#2D3E58] text-[#1A120B] dark:text-[#FAF7F2] placeholder-soft focus:outline-none focus:border-[#8C6843] dark:focus:border-[#E5C158] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold font-mono transition shadow-2xs"
                />
                {errors.email && (
                  <p className="text-xs text-[#B91C1C] mt-1 ml-1 font-bold">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-[#8C6843] dark:text-[#E5C158] mb-1.5 ml-3">
                  Password
                </label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Enter password"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  className="w-full h-11 px-4 py-2 rounded-xl bg-[#FFFFFF] border-2 border-[#BCA58C] dark:border-[#2D3E58] text-[#1A120B] dark:text-[#FAF7F2] placeholder-soft focus:outline-none focus:border-[#8C6843] dark:focus:border-[#E5C158] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold transition shadow-2xs"
                />
                <p className="text-[11px] sm:text-xs text-[#8C7A6B] dark:text-[#94A3B8] font-bold mt-1 ml-1">
                  Minimum 6 characters
                </p>
                {errors.password && (
                  <p className="text-xs text-[#B91C1C] mt-1 ml-1 font-bold">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-[#8C6843] dark:text-[#E5C158] mb-1.5 ml-3">
                  Staff Role
                </label>
                <div className="relative">
                  <select
                    {...register("role")}
                    className="w-full h-11 pl-4 pr-10 py-2 rounded-xl bg-[#FFFFFF] border-2 border-[#BCA58C] dark:border-[#2D3E58] text-[#1A120B] dark:text-[#FAF7F2] focus:outline-none focus:border-[#8C6843] dark:focus:border-[#E5C158] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold transition shadow-2xs appearance-none cursor-pointer"
                  >
                    <option value="operator">Operator — Reception / Front Desk</option>
                    <option value="doctor">Doctor — Clinical Console</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#8C6843] dark:text-[#E5C158] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] sm:text-xs text-[#8C7A6B] dark:text-[#94A3B8] font-bold mt-1 ml-1">
                  Doctor gets the clinical console; Operator gets the reception desk.
                </p>
                {errors.role && (
                  <p className="text-xs text-[#B91C1C] mt-1 ml-1 font-bold">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            {/* Footer: Cancel & Create Account */}
            <div className="mt-4 pt-3.5 border-t border-dashed border-[#D8C5AD] flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE1D3] text-[#4A3522] text-xs sm:text-sm font-bold transition border border-[#D8C5AD]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2.5 disabled:opacity-50 border border-[#2B1E14]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D8C5AD]" />
                ) : (
                  <UserPlus className="w-4 h-4 text-[#D8C5AD]" />
                )}
                <span>{loading ? "Creating..." : "Create Account"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
