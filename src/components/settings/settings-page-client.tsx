"use client";

import React, { useState } from "react";
import { type Service } from "@/types/database";
import { createProcedure, updateProcedure, deleteProcedure } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsPageClientProps {
  initialServices: Service[];
}

export function SettingsPageClient({ initialServices }: SettingsPageClientProps) {
  const router = useRouter();
  const { success, error } = useToast();

  const [services, setServices] = useState<Service[]>(initialServices);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProcName, setNewProcName] = useState("");
  const [newProcPrice, setNewProcPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  React.useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  // Handle Add New Procedure
  const handleAddProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcName.trim()) {
      error("Name Required", "Please enter a procedure name.");
      return;
    }

    const priceNum = parseFloat(newProcPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      error("Valid Price Required", "Please enter a valid procedure price.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProcedure(newProcName.trim(), priceNum);
      if (res.success && res.data) {
        success("Procedure Added 🎉", `${newProcName.trim()} is now active at Rs ${priceNum.toLocaleString()}`);
        setNewProcName("");
        setNewProcPrice("");
        setIsAddModalOpen(false);
        router.refresh();
      } else {
        error("Failed", res.error || "Could not add procedure");
      }
    } catch {
      error("Error", "Unexpected error adding procedure");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing
  const startEditing = (svc: Service) => {
    setEditingId(svc.id);
    setEditName(svc.name);
    setEditPrice(String(svc.price));
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
  };

  // Save edit
  const handleSaveEdit = async (serviceId: string) => {
    if (!editName.trim()) {
      error("Name Required", "Procedure name cannot be empty");
      return;
    }

    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      error("Valid Price Required", "Please enter a valid price");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await updateProcedure(serviceId, editName.trim(), priceNum);
      if (res.success) {
        success("Procedure Updated", `${editName.trim()} saved at Rs ${priceNum.toLocaleString()}`);
        setEditingId(null);
        router.refresh();
      } else {
        error("Update Failed", res.error);
      }
    } catch {
      error("Error", "Unexpected error updating procedure");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Remove procedure
  const handleDeleteProcedure = async (serviceId: string, procName: string) => {
    if (!confirm(`Are you sure you want to remove "${procName}"?`)) return;

    setDeletingId(serviceId);
    try {
      const res = await deleteProcedure(serviceId);
      if (res.success) {
        success("Procedure Removed", `"${procName}" has been removed from clinic procedures.`);
        router.refresh();
      } else {
        error("Delete Failed", res.error);
      }
    } catch {
      error("Error", "Could not remove procedure");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner - With "Total Procedures" & "Add Procedure" Button */}
      <div className="p-6 rounded-3xl bg-[#FCFAF6] border border-[#E8DFD1] aesthetic-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A120B] dark:text-[#FFFFFF] tracking-tight">
              Procedure Setting: Procedures &amp; Pricing
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#8C6843] dark:text-[#E5C158] font-bold mt-1">
            Configure clinic treatments and procedure fees across doctor and reception desks.
          </p>
        </div>

        {/* Right side: Total Procedures Badge + Add Procedure Button */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-5 py-2.5 rounded-2xl border-2 border-[#8C6843] dark:border-[#D4AF37] shadow-xs whitespace-nowrap inline-flex items-center justify-center">
            {services.length} Total Procedures
          </span>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] dark:bg-gradient-to-r dark:from-[#D4AF37] dark:to-[#C5A059] dark:text-[#12100E] font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 border border-[#2B1E14] dark:border-[#E6CA85] whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#D8C5AD] dark:text-[#12100E]" />
            <span>Add Procedure</span>
          </button>
        </div>
      </div>

      {/* 2. Clinical Procedures Table - Exact Queue Table Styling */}
      <div className="rounded-3xl border border-[#E8DFD1] bg-[#FCFAF6] overflow-hidden aesthetic-card-shadow">
        <div className="px-5 sm:px-7 py-5 border-b border-[#E8DFD1] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A120B] dark:text-[#FAF7F2]">
              Active Clinical Procedures
            </h3>
            <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs whitespace-nowrap inline-flex items-center justify-center">
              {services.length} Total
            </span>
          </div>

          <span className="text-xs text-[#8C7A6B] font-bold">
            All prices sync automatically to Doctor & Reception desks
          </span>
        </div>

        {services.length === 0 ? (
          <div className="p-14 text-center text-[#8C7A6B] space-y-2">
            <AlertCircle className="w-8 h-8 text-[#8C7A6B] mx-auto" />
            <p className="font-bold text-lg text-[#1A120B]">No procedures found</p>
            <p className="text-sm text-[#8C7A6B]">Click the &quot;Add Procedure&quot; button above to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#1E1915]">
              <thead className="bg-[#F4EFE6] text-lg font-black tracking-wider text-[#1A120B] border-b border-[#E8DFD1]">
                <tr>
                  <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">#</th>
                  <th className="px-6 py-5 text-left font-black text-base sm:text-lg text-[#1A120B]">Procedure Name</th>
                  <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Procedure Fee</th>
                  <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE6D8]">
                {services.map((svc, index) => {
                  const isEditing = editingId === svc.id;

                  return (
                    <tr
                      key={svc.id}
                      className="hover:bg-[#F7F3EB]/50 transition-colors duration-150"
                    >
                      {/* Sequence Number # */}
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs inline-flex items-center justify-center">
                          #{index + 1}
                        </span>
                      </td>

                      {/* Procedure Name */}
                      <td className="px-6 py-4 text-left">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full max-w-md h-11 px-3.5 rounded-xl bg-white border-2 border-[#8C6843] text-sm font-bold text-[#1A120B] focus:outline-none shadow-2xs"
                            placeholder="Procedure name"
                          />
                        ) : (
                          <div className="font-bold text-[#1A120B] text-base sm:text-lg font-serif">
                            {svc.name}
                          </div>
                        )}
                      </td>

                      {/* Procedure Price */}
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <div className="relative inline-block w-40">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-[#8C6843]">
                              Rs
                            </span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full h-11 pl-9 pr-3 rounded-xl bg-white border-2 border-[#8C6843] text-sm font-mono font-bold text-[#1A120B] focus:outline-none shadow-2xs"
                              placeholder="Price"
                            />
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-xs sm:text-sm text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs inline-flex items-center justify-center">
                            Rs {Number(svc.price).toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center space-x-2">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(svc.id)}
                              disabled={isSavingEdit}
                              className="px-3.5 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2230] hover:bg-[#EAE1D3] text-[#4A3522] dark:text-[#FAF7F2] text-xs sm:text-sm font-bold transition inline-flex items-center gap-1.5 border-2 border-[#D8C5AD] shadow-2xs"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(svc)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2230] hover:bg-[#F2ECE1] dark:hover:bg-[#253245] text-[#1A120B] dark:text-[#FAF7F2] text-xs sm:text-sm font-bold transition inline-flex items-center justify-center gap-1.5 border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs"
                              title="Edit Procedure"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#8C6843] dark:text-[#34D399]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProcedure(svc.id, svc.name)}
                              disabled={deletingId === svc.id}
                              className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2230] hover:bg-[#FEE2E2]/60 dark:hover:bg-[#381116] text-[#DC2626] dark:text-[#F87171] text-xs sm:text-sm font-bold transition inline-flex items-center justify-center gap-1.5 border-2 border-[#DC2626] dark:border-[#EF4444] shadow-2xs"
                              title="Remove Procedure"
                            >
                              {deletingId === svc.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 text-[#DC2626] dark:text-[#F87171]" />
                              )}
                              <span>Remove</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Modal: Add New Procedure (Matching Walk-In Modal Card Style) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        hideDefaultHeader={true}
        maxWidth="md"
      >
        <div className="p-5 sm:p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#D8C5AD] text-left max-w-md mx-auto shadow-xl relative">
          <ModalCloseButton
            onClick={() => setIsAddModalOpen(false)}
            className="absolute right-3.5 top-3.5"
          />

          {/* Header: Aesthetic Clinic Branding (Matching Slip / Walk-In Card Header) */}
          <div className="text-center border-b border-dashed border-[#D8C5AD] pb-2.5">
            <h5 className="font-serif font-black text-base tracking-wider text-[#1A120B] uppercase">
              Add New Clinical Procedure
            </h5>
            <p className="text-sm text-[#5C4D3E] font-bold mt-0.5">
              Set treatment name and service fee
            </p>
          </div>

          {/* Form Body: Matching Walk-In Card Style */}
          <form onSubmit={handleAddProcedure}>
            <div className="py-2.5 space-y-3.5 max-w-[350px] mx-auto w-full">
              {/* Procedure Name Input */}
              <div className="border-t border-dashed border-[#D8C5AD] pt-3">
                <label className="block text-base sm:text-lg font-black text-[#1A120B] mb-1.5 ml-3">
                  Procedure Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter procedure name (e.g. Laser Hair)"
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  className="w-full h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border-2 border-[#BCA58C] text-[#1A120B] placeholder-[#8C7A6B] focus:outline-none focus:border-[#8C6843] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold transition shadow-2xs"
                />
              </div>

              {/* Procedure Price Input */}
              <div>
                <label className="block text-base sm:text-lg font-black text-[#1A120B] mb-1.5 ml-3">
                  Procedure Price (Fee)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-sm text-[#8C6843]">
                    Rs
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    placeholder="Enter fee (e.g. 5000)"
                    value={newProcPrice}
                    onChange={(e) => setNewProcPrice(e.target.value)}
                    className="w-full h-10 pl-11 pr-4 py-2 rounded-xl bg-[#FAF7F2] border-2 border-[#BCA58C] text-[#1A120B] placeholder-[#8C7A6B] focus:outline-none focus:border-[#8C6843] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-mono font-bold transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Footer: Cancel & Add Procedure (Matching Walk-In Button Styles) */}
            <div className="mt-4 pt-3.5 border-t border-dashed border-[#D8C5AD] flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE1D3] text-[#4A3522] text-xs font-bold transition border border-[#E9DFD1]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] font-bold text-xs shadow-md transition flex items-center gap-2.5 disabled:opacity-50 border border-[#2B1E14]"
              >
                <Plus className="w-4 h-4 text-[#D8C5AD]" />
                <span>{isSubmitting ? "Adding..." : "Add Procedure"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
