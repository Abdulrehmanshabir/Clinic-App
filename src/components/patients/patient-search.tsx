"use client";

import React, { useState, useEffect } from "react";
import { searchPatients } from "@/lib/actions";
import { type Patient } from "@/types/database";
import { Search, Phone, ArrowRight, Loader2 } from "lucide-react";

interface PatientSearchProps {
  onSelectPatient: (patient: Patient) => void;
  selectedPatientId?: string;
}

export function PatientSearch({ onSelectPatient, selectedPatientId }: PatientSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchPatients(query);
        if (res.success && res.data) {
          setResults(res.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Patient ID (P-000001), Name or Phone..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
        />
        {loading && (
          <Loader2 className="w-4 h-4 absolute right-3.5 top-3.5 text-teal-400 animate-spin" />
        )}
      </div>

      {/* Results Dropdown / List */}
      {results.length > 0 && (
        <div className="border border-slate-800 bg-slate-950/90 backdrop-blur-md rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-800/60 shadow-xl custom-scrollbar">
          {results.map((patient) => {
            const isSelected = selectedPatientId === patient.id;
            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`p-3 flex items-center justify-between hover:bg-slate-800/60 cursor-pointer transition ${
                  isSelected ? "bg-teal-500/10 border-l-2 border-l-teal-400" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 font-bold text-xs">
                    {patient.patient_number.replace("P-", "")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{patient.full_name}</span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-teal-400 border border-slate-800">
                        {patient.patient_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {patient.phone}
                      </span>
                      <span className="capitalize">• {patient.gender}</span>
                      {patient.age && <span>• {patient.age} yrs</span>}
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {query.trim().length > 0 && !loading && results.length === 0 && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center text-xs text-slate-400">
          No patients found matching &quot;{query}&quot;. Register a new patient.
        </div>
      )}
    </div>
  );
}
