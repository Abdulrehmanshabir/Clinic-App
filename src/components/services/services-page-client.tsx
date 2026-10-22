"use client";

import React, { useState } from "react";
import { type Service } from "@/types/database";
import { createOrUpdateService } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Layers, Plus, Edit2, Clock, DollarSign, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema } from "@/lib/validations";
import { z } from "zod";
import { useRouter } from "next/navigation";

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServicesPageClientProps {
  initialServices: Service[];
}

export function ServicesPageClient({ initialServices }: ServicesPageClientProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      duration_minutes: 30,
      price: 50,
      is_active: true,
    },
  });

  const openCreateModal = () => {
    setEditingService(null);
    reset({
      name: "",
      description: "",
      duration_minutes: 30,
      price: 50,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (svc: Service) => {
    setEditingService(svc);
    reset({
      name: svc.name,
      description: svc.description || "",
      duration_minutes: svc.duration_minutes,
      price: Number(svc.price),
      is_active: svc.is_active,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    setLoading(true);
    try {
      const res = await createOrUpdateService(data, editingService?.id);
      if (res.success && res.data) {
        success(editingService ? "Service Updated" : "Service Created");
        setIsModalOpen(false);
        router.refresh();
      } else {
        error("Failed", res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-400" />
            Clinical Services & Pricing
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure dermatology consultations, aesthetic procedures, duration estimates, and fee schedules.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialServices.map((svc) => (
          <div
            key={svc.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white text-base">{svc.name}</h3>
                {svc.is_active ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                    Inactive
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {svc.description || "No description provided."}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  {svc.duration_minutes} mins
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  {Number(svc.price).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => openEditModal(svc)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Edit Service"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Service Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? "Edit Clinical Service" : "Add New Clinical Service"}
        subtitle="Configure consultation or procedure details"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Service Name <span className="text-rose-400">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="e.g. HydraFacial Glow"
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Details regarding procedure, skin types, or protocol..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-sm text-white outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Duration (Minutes) <span className="text-rose-400">*</span>
              </label>
              <input
                {...register("duration_minutes", { valueAsNumber: true })}
                type="number"
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Price ($) <span className="text-rose-400">*</span>
              </label>
              <input
                {...register("price", { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              {...register("is_active")}
              id="is_active_cb"
              type="checkbox"
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-teal-500 focus:ring-teal-500"
            />
            <label htmlFor="is_active_cb" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Service is active & selectable for appointments
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Service
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
