"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientSchema } from "@/lib/validations";
import { createPatient } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { type Patient } from "@/types/database";
import { User, Phone, Mail, MapPin, Calendar, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";

type PatientFormData = z.infer<typeof patientSchema>;

interface NewPatientFormProps {
  onSuccess?: (patient: Patient) => void;
  onCancel?: () => void;
}

export function NewPatientForm({ onSuccess, onCancel }: NewPatientFormProps) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      gender: "female",
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      const res = await createPatient(data);
      if (res.success && res.data) {
        setCreatedPatient(res.data);
        success("Patient Registered Successfully", `Patient ID: ${res.data.patient_number}`);
        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        error("Registration Failed", res.error || "Could not register patient");
      }
    } catch {
      error("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (createdPatient) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-white">Registration Complete</h4>
          <p className="text-sm text-slate-400 mt-1">Patient record has been created permanently</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 inline-block text-left min-w-[280px]">
          <div className="text-xs text-slate-400">Assigned Patient ID</div>
          <div className="text-2xl font-mono font-extrabold text-teal-400 tracking-wider">
            {createdPatient.patient_number}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-200">
            {createdPatient.full_name}
          </div>
          <div className="text-xs text-slate-400">{createdPatient.phone}</div>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCreatedPatient(null);
              reset();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition"
          >
            Register Another
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-teal-400" />
          Full Name <span className="text-rose-400">*</span>
        </label>
        <input
          {...register("full_name")}
          type="text"
          placeholder="e.g. Sara Ahmed"
          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
        />
        {errors.full_name && (
          <p className="text-xs text-rose-400 mt-1">{errors.full_name.message}</p>
        )}
      </div>

      {/* Phone Number & Gender Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-teal-400" />
            Phone Number <span className="text-rose-400">*</span>
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="e.g. +1 555-019-2834"
            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          />
          {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Gender <span className="text-rose-400">*</span>
          </label>
          <select
            {...register("gender")}
            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition"
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <p className="text-xs text-rose-400 mt-1">{errors.gender.message}</p>}
        </div>
      </div>

      {/* Date of Birth / Age Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            Date of Birth
          </label>
          <input
            {...register("date_of_birth")}
            type="date"
            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Age (Years)
          </label>
          <input
            {...register("age", { valueAsNumber: true })}
            type="number"
            placeholder="e.g. 28"
            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>
      </div>

      {/* Email & Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            Email (Optional)
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="patient@example.com"
            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          />
          {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            Address / City
          </label>
          <input
            {...register("address")}
            type="text"
            placeholder="e.g. Downtown, Street 12"
            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>
      </div>

      {/* Initial Notes / Skin Concerns */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-teal-400" />
          Primary Concern / Notes
        </label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="e.g. Severe cystic acne, sensitive skin, previous allergy history..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 text-sm font-bold shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering...
            </>
          ) : (
            "Save & Register Patient"
          )}
        </button>
      </div>
    </form>
  );
}
