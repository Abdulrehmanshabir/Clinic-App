import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type Appointment, type QueueSummary, type ClinicDay, type Service, type Profile, type ClinicSettings, type DoctorBreakInfo, type ActiveSession, type ClinicShift } from "@/types/database";

export const getCurrentProfile = cache(async (): Promise<Profile> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Return default guest doctor profile if unauthenticated
      return {
        id: "doctor-default",
        full_name: "Dr. Admin",
        email: "doctor@clinic.com",
        role: "doctor",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.role) {
      return profile;
    }

    // Resolve role safely from user email / metadata
    const userRole = (user.user_metadata?.role as "doctor" | "operator") ||
      (user.email?.toLowerCase().includes("operator") ? "operator" : "doctor");

    // Auto-upsert profile using admin client to ensure database sync
    try {
      const admin = createAdminClient();
      await admin.from("profiles").upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || (userRole === "doctor" ? "Dr. Admin" : "Front Desk Operator"),
        email: user.email || "",
        role: userRole,
        is_active: true,
      });
    } catch {
      // ignore
    }

    return {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || (userRole === "doctor" ? "Dr. Admin" : "Front Desk Operator"),
      email: user.email || "",
      role: userRole,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Profile resolution fallback:", err);
    return {
      id: "doctor-fallback",
      full_name: "Dr. Admin",
      email: "doctor@clinic.com",
      role: "doctor",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
});

const APPOINTMENT_DETAILS_SELECT = `
  *,
  patient:patients (
    id,
    patient_number,
    full_name,
    phone,
    gender,
    age,
    date_of_birth
  ),
  token:tokens (
    id,
    token_number,
    token_date,
    queue_position
  ),
  service:services (
    id,
    name,
    duration_minutes,
    price
  ),
  doctor:profiles!appointments_doctor_id_fkey (
    id,
    full_name
  ),
  consultation:consultations (
    id,
    started_at,
    completed_at,
    doctor_notes,
    treatment_notes,
    follow_up_date
  )
`;

function sortAppointmentsByQueue(data: Appointment[]): Appointment[] {
  return data.sort((a, b) => {
    if (a.token?.queue_position && b.token?.queue_position) {
      return a.token.queue_position - b.token.queue_position;
    }
    return a.appointment_time.localeCompare(b.appointment_time);
  });
}

export async function getTodayAppointments(clinicDate: string): Promise<Appointment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_DETAILS_SELECT)
    .eq("appointment_date", clinicDate)
    .order("appointment_time", { ascending: true });

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return sortAppointmentsByQueue((data || []) as unknown as Appointment[]);
}

export async function searchAppointmentsAcrossDates(
  query: string
): Promise<Appointment[]> {
  const term = query.trim();
  const cleaned = term.replace(/[,()*"'\\]/g, " ").trim();
  if (!cleaned) return [];

  const supabase = await createClient();
  const like = `%${cleaned}%`;

  const [patientsResult, tokensResult] = await Promise.all([
    supabase
      .from("patients")
      .select("id")
      .or(
        `full_name.ilike.${like},phone.ilike.${like},patient_number.ilike.${like}`
      )
      .limit(100),
    supabase
      .from("tokens")
      .select("appointment_id")
      .ilike("token_number", like)
      .limit(100),
  ]);

  const patientIds = Array.from(
    new Set((patientsResult.data || []).map((row) => row.id))
  );
  const appointmentIds = Array.from(
    new Set((tokensResult.data || []).map((row) => row.appointment_id))
  );

  if (patientIds.length === 0 && appointmentIds.length === 0) return [];

  const filters: string[] = [];
  if (patientIds.length > 0) {
    filters.push(`patient_id.in.(${patientIds.join(",")})`);
  }
  if (appointmentIds.length > 0) {
    filters.push(`id.in.(${appointmentIds.join(",")})`);
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_DETAILS_SELECT)
    .or(filters.join(","))
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error searching appointments:", error);
    return [];
  }

  return ((data || []) as unknown as Appointment[]).sort(
    (a, b) =>
      b.appointment_date.localeCompare(a.appointment_date) ||
      b.appointment_time.localeCompare(a.appointment_time)
  );
}

export async function getClinicDayStatus(clinicDate: string): Promise<ClinicDay | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("clinic_days")
    .select("*")
    .eq("clinic_date", clinicDate)
    .maybeSingle();

  return data || null;
}

export const getActiveServices = cache(async (): Promise<Service[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return [];
  return data || [];
});

export async function getAllServices(): Promise<Service[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true });

  if (error) return [];
  return data || [];
}

export const getClinicSettings = cache(async (): Promise<ClinicSettings | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clinic_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data || null;
  } catch {
    return null;
  }
});

export const getDoctorsList = cache(async (): Promise<Profile[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "doctor")
    .eq("is_active", true);

  if (error) return [];
  return data || [];
});

export function calculateQueueSummary(appointments: Appointment[]): QueueSummary {
  return {
    total: appointments.length,
    waiting: appointments.filter((a) => a.status === "waiting").length,
    called: appointments.filter((a) => a.status === "called").length,
    in_consultation: appointments.filter((a) => a.status === "in_consultation").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
    no_show: appointments.filter((a) => a.status === "no_show").length,
  };
}

export const getActiveSession = cache(async (clinicDate: string): Promise<ActiveSession | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clinic_days")
      .select("notes")
      .eq("clinic_date", clinicDate)
      .maybeSingle();

    if (!data?.notes) return null;
    const parsed = JSON.parse(data.notes);
    const session = parsed?.active_session;
    const shift = session?.shift as ClinicShift | undefined;
    if (shift !== "morning" && shift !== "evening") return null;
    if (session.date && session.date !== clinicDate) return null;

    return {
      shift,
      date: session.date || clinicDate,
      start_time: session.start_time || undefined,
      started_at: session.started_at || "",
      started_by: session.started_by || null,
    };
  } catch {
    return null;
  }
});

export const getDoctorBreakStatus = cache(async (clinicDate: string): Promise<DoctorBreakInfo | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clinic_days")
      .select("notes")
      .eq("clinic_date", clinicDate)
      .maybeSingle();

    if (!data?.notes) return null;
    const parsed = JSON.parse(data.notes);
    if (parsed?.doctor_break?.on_break) {
      return parsed.doctor_break as DoctorBreakInfo;
    }
    return null;
  } catch {
    return null;
  }
});

