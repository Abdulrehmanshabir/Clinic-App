import { type Appointment, type Service } from "@/types/database";

export interface ProcedureCategory {
  id: string;
  name: string;
  shortLabel: string;
  defaultPrice: number;
  description: string;
  tag: string;
}

export const CANONICAL_PROCEDURES: ProcedureCategory[] = [
  {
    id: "laser_hair",
    name: "Laser Hair",
    shortLabel: "Laser Hair",
    defaultPrice: 5000,
    description: "Diode & Alexandrite precision permanent laser hair reduction",
    tag: "Laser",
  },
  {
    id: "cauter_cryo",
    name: "Cauter/CRYO",
    shortLabel: "Cauter / CRYO",
    defaultPrice: 3500,
    description: "Electrocautery & liquid nitrogen cryotherapy lesion removal",
    tag: "Dermatosurgery",
  },
  {
    id: "microneedling_prp",
    name: "Microneedling/PRP",
    shortLabel: "Microneedling / PRP",
    defaultPrice: 8000,
    description: "Collagen induction therapy & platelet-rich plasma rejuvenation",
    tag: "Rejuvenation",
  },
  {
    id: "laser_co2_q",
    name: "Laser Co2/Q",
    shortLabel: "Laser Co2 / Q",
    defaultPrice: 10000,
    description: "Fractional CO2 resurfacing & Q-Switched pigmentation laser",
    tag: "Laser Resurfacing",
  },
  {
    id: "injections",
    name: "Injections (Filler, Botox, Whitening)",
    shortLabel: "Injections",
    defaultPrice: 15000,
    description: "Dermal fillers, anti-wrinkle Botox, and Glutathione whitening protocols",
    tag: "Injectables",
  },
  {
    id: "hydrafacial",
    name: "Hydrafacial",
    shortLabel: "Hydrafacial",
    defaultPrice: 6000,
    description: "Medical grade vortex deep exfoliation & infusion facial",
    tag: "Aesthetic Facial",
  },
  {
    id: "other_procedures",
    name: "Other Procedures",
    shortLabel: "Other",
    defaultPrice: 4000,
    description: "Chemical peels, minor surgical excision, and custom dermatologic care",
    tag: "General Procedures",
  },
];

/**
 * Match an appointment to one of the 7 canonical procedures based on its attached service.
 */
export function matchAppointmentToProcedure(
  appointment: Appointment,
  activeServices: Service[] = []
): string {
  const serviceName = appointment.service?.name?.toLowerCase() || "";
  const notes = (appointment.notes || "").toLowerCase();

  // 1. Laser Hair
  if (
    serviceName.includes("laser hair") ||
    serviceName.includes("hair reduction") ||
    notes.includes("laser hair")
  ) {
    return "Laser Hair";
  }

  // 2. Cauter/CRYO
  if (
    serviceName.includes("cauter") ||
    serviceName.includes("cryo") ||
    notes.includes("cauter") ||
    notes.includes("cryo")
  ) {
    return "Cauter/CRYO";
  }

  // 3. Microneedling/PRP
  if (
    serviceName.includes("microneed") ||
    serviceName.includes("miconced") ||
    serviceName.includes("prp") ||
    notes.includes("microneed") ||
    notes.includes("prp")
  ) {
    return "Microneedling/PRP";
  }

  // 4. Laser Co2/Q
  if (
    serviceName.includes("co2") ||
    serviceName.includes("laser co2") ||
    serviceName.includes("q-switch") ||
    serviceName.includes("scar laser") ||
    serviceName.includes("pigmentation") ||
    notes.includes("co2") ||
    notes.includes("q-switch")
  ) {
    return "Laser Co2/Q";
  }

  // 5. Injections (Filler, Botox, Whitening)
  if (
    serviceName.includes("injection") ||
    serviceName.includes("botox") ||
    serviceName.includes("filler") ||
    serviceName.includes("whitening") ||
    notes.includes("botox") ||
    notes.includes("filler") ||
    notes.includes("injection") ||
    notes.includes("whitening")
  ) {
    return "Injections (Filler, Botox, Whitening)";
  }

  // 6. Hydrafacial
  if (
    serviceName.includes("hydra") ||
    serviceName.includes("facial") ||
    notes.includes("hydra") ||
    notes.includes("facial")
  ) {
    return "Hydrafacial";
  }

  // Exact name matches from DB services:
  if (appointment.service_id && activeServices.length > 0) {
    const svc = activeServices.find((s) => s.id === appointment.service_id);
    if (svc) {
      const match = CANONICAL_PROCEDURES.find((p) => p.name === svc.name);
      if (match) return match.name;
    }
  }

  // 7. Fallback to Other Procedures
  return "Other Procedures";
}
