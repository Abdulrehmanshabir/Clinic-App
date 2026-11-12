"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consultationSchema } from "@/lib/validations";
import { saveConsultationNotes } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { type Appointment } from "@/types/database";
import {
  FileText,
  Calendar,
  Loader2,
  Save,
} from "lucide-react";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { formatClinicDate, getTodayDateString } from "@/lib/utils";
import { z } from "zod";

type ConsultationFormData = z.infer<typeof consultationSchema>;

interface ConsultationModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  readOnly?: boolean;
}

export function ConsultationModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
  readOnly = false,
}: ConsultationModalProps) {
  const { success, error } = useToast();
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      appointment_id: appointment?.id || "",
      doctor_notes: appointment?.consultation?.doctor_notes || "",
      follow_up_date: appointment?.consultation?.follow_up_date || undefined,
    },
  });

  const watchedFollowUpDate = watch("follow_up_date");

  useEffect(() => {
    if (appointment && isOpen) {
      reset({
        appointment_id: appointment.id,
        doctor_notes: appointment.consultation?.doctor_notes || "",
        follow_up_date: appointment.consultation?.follow_up_date || undefined,
      });
    }
  }, [appointment, isOpen, reset]);

  if (!isOpen || !appointment) return null;

  const handleSaveNotes = async (data: ConsultationFormData) => {
    if (readOnly) return;

    setIsSavingNotes(true);
    try {
      const res = await saveConsultationNotes({
        appointment_id: appointment.id,
        doctor_notes: data.doctor_notes || "",
        follow_up_date: data.follow_up_date || undefined,
      });

      if (res.success) {
        const isCompleted = appointment.status === "completed";
        success(
          "Notes Saved",
          isCompleted ? "Patient notes updated successfully" : "Doctor notes saved successfully"
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        error("Action Failed", res.error || "Could not save notes");
      }
    } catch {
      error("Error", "An unexpected error occurred while saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSubmitNotes = (data: ConsultationFormData) => {
    if (readOnly) {
      onClose();
      return;
    }
    void handleSaveNotes(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A120B]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FCFAF6] dark:bg-[#121824] border border-[#E8DFD1] dark:border-[#243248] rounded-3xl shadow-2xl shadow-[#1A120B]/15 dark:shadow-black/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header: ONLY Patient Name and Token Number with 7 Total Procedures Outline */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#E8DFD1] dark:border-[#243248] bg-[#FAF7F2] dark:bg-[#151D2A] flex items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <h3 className="text-lg sm:text-2xl font-serif font-black text-[#1A120B] dark:text-[#FAF7F2] truncate tracking-tight">
              {appointment.patient?.full_name}
            </h3>
            {/* Token with exact outline from 7 Total Procedures badge on Dr Dashboard */}
            <span className="font-mono font-black text-xs sm:text-base px-2.5 sm:px-3.5 py-1 rounded-2xl bg-[#FAF7F2] dark:bg-[#1A2230] text-[#1A120B] dark:text-[#FAF7F2] border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs shrink-0 tracking-wide whitespace-nowrap">
              {appointment.token?.token_number || "No Token"}
            </span>
          </div>

          <ModalCloseButton
            onClick={onClose}
            disabled={isSavingNotes}
            className="shrink-0"
          />
        </div>

        {/* Clinical Form: ONLY Notes & Follow-Up Date */}
        <form
          onSubmit={handleSubmit(handleSubmitNotes)}
          className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#FCFAF6] dark:bg-[#121824] custom-scrollbar"
        >
          {/* Notes Box */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-[#8C6843] dark:text-[#E5C158] mb-1.5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#8C6843] dark:text-[#E5C158]" />
              <span>Doctor Notes</span>
            </label>
            <textarea
              {...register("doctor_notes")}
              rows={3}
              readOnly={readOnly}
              placeholder={readOnly ? "No clinical notes entered by doctor." : "Write clinical observations, diagnosis, treatment advice, or remarks..."}
              className={`w-full bg-[#FAF7F2] dark:bg-[#0B0F17] border border-[#E8DFD1] dark:border-[#243248] focus:border-[#8C6843] dark:focus:border-[#E5C158] rounded-2xl p-3 text-sm font-medium text-[#1A120B] dark:text-[#FAF7F2] placeholder-[#A89887] dark:placeholder-[#64748B] outline-none transition resize-none shadow-2xs leading-relaxed ${readOnly ? "cursor-default select-text" : ""}`}
            />
            {errors.doctor_notes && (
              <p className="text-xs text-rose-500 mt-1 font-bold">{errors.doctor_notes.message}</p>
            )}
          </div>

          {/* Follow-Up Date (Compact Width) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm sm:text-base font-bold text-[#8C6843] dark:text-[#E5C158] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#8C6843] dark:text-[#E5C158]" />
                <span>Follow-Up Date</span>
              </label>
              {watchedFollowUpDate ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-xl bg-[#F4EFE6] dark:bg-[#1A2234] text-[#8C6843] dark:text-[#E5C158] border border-[#D8C5AD] dark:border-[#2D3E58]">
                  {formatClinicDate(watchedFollowUpDate)}
                </span>
              ) : readOnly ? (
                <span className="text-xs font-bold text-[#8C7A6B] dark:text-[#94A3B8] italic">
                  No follow-up set
                </span>
              ) : null}
            </div>

            <input
              {...register("follow_up_date")}
              type="date"
              disabled={readOnly}
              readOnly={readOnly}
              min={getTodayDateString()}
              className={`w-56 sm:w-64 bg-[#FAF7F2] dark:bg-[#0B0F17] border border-[#E8DFD1] dark:border-[#243248] focus:border-[#8C6843] dark:focus:border-[#E5C158] rounded-2xl px-3.5 py-2.5 text-sm font-bold text-[#1A120B] dark:text-[#FAF7F2] outline-none transition shadow-2xs [color-scheme:light] dark:[color-scheme:dark] ${readOnly ? "cursor-default opacity-90" : "cursor-pointer"}`}
            />
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[#E8DFD1] dark:border-[#243248] flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSavingNotes}
              className="px-5 py-2.5 rounded-2xl bg-transparent hover:bg-[#F4EFE6] dark:hover:bg-[#1A2234] text-[#8C6843] dark:text-[#A89887] hover:text-[#1A120B] dark:hover:text-[#FAF7F2] border border-[#E8DFD1] dark:border-[#243248] text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              Close
            </button>

            {!readOnly && (
              <button
                type="submit"
                disabled={isSavingNotes}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#5C3D22] via-[#8C6843] to-[#B08A5C] hover:from-[#6F4E2E] hover:via-[#A07A50] hover:to-[#C29A6B] text-white font-bold text-xs shadow-md shadow-[#8C6843]/25 transition-all duration-200 flex items-center gap-2 border border-[#4A3018] cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSavingNotes ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Notes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
