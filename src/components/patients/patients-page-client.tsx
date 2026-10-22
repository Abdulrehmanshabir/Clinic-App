"use client";

import React, { useState } from "react";
import { type Patient, type Appointment } from "@/types/database";
import { Modal } from "@/components/ui/modal";
import { NewPatientForm } from "@/components/patients/new-patient-form";
import { PatientSearch } from "@/components/patients/patient-search";
import { formatClinicDate } from "@/lib/utils";
import { getPatientDetails } from "@/lib/actions";
import { Users, UserPlus, Clock, Eye } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

import { useRealtimeAppointments } from "@/hooks/use-realtime-appointments";
import { getTodayDateString } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PatientsPageClientProps {
  initialPatients: Patient[];
}

export function PatientsPageClient({ initialPatients }: PatientsPageClientProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPatientFull, setSelectedPatientFull] = useState<Patient | null>(null);

  // Sync state when server props update
  React.useEffect(() => {
    setPatients(initialPatients);
  }, [initialPatients]);

  // Realtime updates
  useRealtimeAppointments({
    clinicDate: getTodayDateString(),
    onUpdate: () => {
      router.refresh();
    },
  });

  const openPatientHistory = async (patientId: string) => {
    try {
      const res = await getPatientDetails(patientId);
      if (res.success && res.data) {
        setSelectedPatientFull(res.data);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-400" />
            Patient Directory & Medical Records
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage permanent patient profiles, longitudinal visit history, and clinical documentation.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      {/* Instant Search Bar */}
      <div className="max-w-xl">
        <PatientSearch
          onSelectPatient={(patient) => {
            openPatientHistory(patient.id);
          }}
        />
      </div>

      {/* Patients Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Registered Patients</h3>
          <span className="text-xs text-slate-400 font-mono">
            {patients.length} Total Patients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Patient ID</th>
                <th className="px-5 py-3">Full Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Demographics</th>
                <th className="px-5 py-3">Registered On</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-900/40 transition">
                  <td className="px-5 py-3.5 font-mono font-bold text-teal-400">
                    {patient.patient_number}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-white">
                    {patient.full_name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {patient.phone}
                  </td>
                  <td className="px-5 py-3.5 capitalize text-xs text-slate-400">
                    {patient.gender} {patient.age ? `• ${patient.age} yrs` : ""}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {formatClinicDate(patient.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => openPatientHistory(patient.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-teal-500/20 hover:text-teal-300 hover:border-teal-500/30 border border-slate-700 text-xs font-semibold transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Medical History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Patient */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Register New Patient"
        subtitle="Create permanent record"
        maxWidth="lg"
      >
        <NewPatientForm
          onSuccess={(p) => {
            setPatients((prev) => [p, ...prev]);
            setIsNewModalOpen(false);
            openPatientHistory(p.id);
          }}
          onCancel={() => setIsNewModalOpen(false)}
        />
      </Modal>

      {/* Modal / Drawer: Patient Full History */}
      <Modal
        isOpen={!!selectedPatientFull}
        onClose={() => setSelectedPatientFull(null)}
        title={selectedPatientFull ? `${selectedPatientFull.full_name} (${selectedPatientFull.patient_number})` : "Patient History"}
        subtitle="Complete longitudinal visit timeline and clinical history"
        maxWidth="2xl"
      >
        {selectedPatientFull && (
          <div className="space-y-6">
            {/* Demographic Info */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="text-slate-200 font-semibold">{selectedPatientFull.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Gender & Age</span>
                <span className="text-slate-200 font-semibold capitalize">
                  {selectedPatientFull.gender} {selectedPatientFull.age ? `(${selectedPatientFull.age}y)` : ""}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Email</span>
                <span className="text-slate-200 font-semibold">{selectedPatientFull.email || "N/A"}</span>
              </div>
              {selectedPatientFull.notes && (
                <div className="col-span-full border-t border-slate-900 pt-2">
                  <span className="text-slate-500 block">Primary Concern</span>
                  <span className="text-slate-300">{selectedPatientFull.notes}</span>
                </div>
              )}
            </div>

            {/* Visit Timeline */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historical Visit Records
              </h4>

              {!selectedPatientFull.appointments || selectedPatientFull.appointments.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  No previous visit records found for this patient.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedPatientFull.appointments.map((visit: Appointment) => (
                    <div
                      key={visit.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-teal-400 text-sm px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                            {visit.token?.token_number || "T-000"}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-white">
                              {formatClinicDate(visit.appointment_date)}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">
                              {visit.appointment_time}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={visit.status} size="sm" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-900">
                        <div>
                          <span className="text-slate-500 block">Service</span>
                          <span className="text-slate-200 font-medium">
                            {visit.service?.name || "General Skin Consult"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Doctor</span>
                          <span className="text-slate-200 font-medium">
                            {visit.doctor?.full_name || "Clinic Specialist"}
                          </span>
                        </div>
                      </div>

                      {/* Clinical notes if available */}
                      {visit.consultation && (
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                          {visit.consultation.doctor_notes && (
                            <div>
                              <span className="text-teal-400 font-semibold">Diagnosis: </span>
                              <span className="text-slate-300">{visit.consultation.doctor_notes}</span>
                            </div>
                          )}
                          {visit.consultation.treatment_notes && (
                            <div>
                              <span className="text-teal-400 font-semibold">Treatment / Rx: </span>
                              <span className="text-slate-300">{visit.consultation.treatment_notes}</span>
                            </div>
                          )}
                          {visit.consultation.follow_up_date && (
                            <div>
                              <span className="text-amber-400 font-semibold">Follow-Up Date: </span>
                              <span className="text-slate-300">
                                {formatClinicDate(visit.consultation.follow_up_date)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
