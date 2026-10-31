"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  patientSchema,
  appointmentSchema,
  consultationSchema,
  serviceSchema,
  operatorSchema,
  clinicSettingsSchema,
} from "@/lib/validations";
import { type ActiveSession, type AppointmentStatus, type ClinicShift } from "@/types/database";
import { getTodayDateString } from "@/lib/utils";
import {
  appendShiftTag,
  getShiftFromNotes,
  getShiftFromTime,
  getShiftFromToken,
  getShiftTag,
  getShiftTokenPrefix,
  isClinicShift,
} from "@/lib/session";
import { HEAD_DOCTOR_EMAIL, isHeadDoctorEmail } from "@/lib/roles";
import { getTodayAppointments, searchAppointmentsAcrossDates } from "@/lib/queries";

async function getActingStaffProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  return profile as { id: string; email: string; role: string } | null;
}

type ClinicNotesPayload = Record<string, unknown>;

function parseClinicNotes(notes: string | null | undefined): ClinicNotesPayload {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ClinicNotesPayload;
    }
  } catch {
    // Legacy plain-text notes
  }
  return { closing_notes: notes };
}

function serializeClinicNotes(notes: ClinicNotesPayload): string | null {
  return Object.keys(notes).length > 0 ? JSON.stringify(notes) : null;
}

async function readClinicNotes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicDate: string
): Promise<ClinicNotesPayload> {
  const { data } = await supabase
    .from("clinic_days")
    .select("notes")
    .eq("clinic_date", clinicDate)
    .maybeSingle();

  return parseClinicNotes(data?.notes);
}

async function getActiveSessionForDate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicDate: string
): Promise<ActiveSession | null> {
  const notes = await readClinicNotes(supabase, clinicDate);
  const session = notes.active_session as ActiveSession | undefined;

  if (!session || !isClinicShift(session.shift)) return null;
  if (session.date && session.date !== clinicDate) return null;

  return {
    shift: session.shift,
    date: session.date || clinicDate,
    start_time: session.start_time,
    started_at: session.started_at || "",
    started_by: session.started_by || null,
  };
}

async function getNextSessionToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicDate: string,
  shift: ClinicShift
): Promise<{ nextPos: number; sequence: number; tokenNumber: string }> {
  const { data: tokens } = await supabase
    .from("tokens")
    .select("token_number, queue_position, appointment:appointments(appointment_time, notes)")
    .eq("token_date", clinicDate);

  const rows = tokens || [];
  let sequence = 0;
  let maxQueuePosition = 0;

  for (const row of rows) {
    maxQueuePosition = Math.max(maxQueuePosition, row.queue_position || 0);

    const appointment = Array.isArray(row.appointment)
      ? row.appointment[0]
      : row.appointment;
    const rowShift =
      getShiftFromToken(row.token_number) ??
      getShiftFromNotes(appointment?.notes) ??
      getShiftFromTime(appointment?.appointment_time);

    if (rowShift === shift) sequence += 1;
  }

  return {
    nextPos: maxQueuePosition + 1,
    sequence: sequence + 1,
    tokenNumber: `${getShiftTokenPrefix(shift)}${String(sequence + 1).padStart(3, "0")}`,
  };
}

// Helper to record audit log
async function logAudit(
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, unknown>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("audit_logs").insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

// -----------------------------------------------------------------------------
// 1. PATIENT ACTIONS
// -----------------------------------------------------------------------------
export async function createPatient(formData: unknown) {
  const result = patientSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Validation failed" };
  }

  const supabase = await createClient();

  // Check duplicate phone
  const { data: existing } = await supabase
    .from("patients")
    .select("id, full_name, patient_number")
    .eq("phone", result.data.phone)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `Patient with phone ${result.data.phone} already exists (${existing.full_name} - ${existing.patient_number})`,
    };
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      full_name: result.data.full_name,
      phone: result.data.phone,
      gender: result.data.gender,
      date_of_birth: result.data.date_of_birth || null,
      age: result.data.age || null,
      email: result.data.email || null,
      address: result.data.address || null,
      notes: result.data.notes || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await logAudit("CREATE_PATIENT", "patients", patient.id, {
    patient_number: patient.patient_number,
    full_name: patient.full_name,
  });

  revalidatePath("/patients");
  revalidatePath("/operator");
  return { success: true, data: patient };
}

export async function searchPatients(query: string) {
  if (!query || query.trim().length === 0) return { success: true, data: [] };
  const term = query.trim();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .or(`patient_number.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data || [] };
}

export async function getPatientDetails(patientId: string) {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select(`
      *,
      appointments (
        id,
        appointment_date,
        appointment_time,
        appointment_type,
        status,
        notes,
        created_at,
        token:tokens (
          token_number,
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
      )
    `)
    .eq("id", patientId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Sort visits descending
  if (patient.appointments) {
    patient.appointments.sort(
      (a: { appointment_date: string; appointment_time: string }, b: { appointment_date: string; appointment_time: string }) =>
        `${b.appointment_date} ${b.appointment_time}`.localeCompare(`${a.appointment_date} ${a.appointment_time}`)
    );
  }

  return { success: true, data: patient };
}

// -----------------------------------------------------------------------------
// 2. APPOINTMENT & TOKEN ACTIONS
// -----------------------------------------------------------------------------
export async function createAppointment(formData: unknown) {
  const result = appointmentSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Validation failed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const activeSession = await getActiveSessionForDate(
    supabase,
    result.data.appointment_date
  );
  const notesToSave = activeSession
    ? appendShiftTag(result.data.notes, activeSession.shift)
    : result.data.notes || null;

  // 1. Insert Appointment
  const { data: appointment, error: appError } = await supabase
    .from("appointments")
    .insert({
      patient_id: result.data.patient_id,
      doctor_id: result.data.doctor_id || null,
      appointment_date: result.data.appointment_date,
      appointment_time: result.data.appointment_time,
      service_id: result.data.service_id || null,
      appointment_type: result.data.appointment_type,
      status: "waiting",
      notes: notesToSave,
      created_by: user?.id || null,
    })
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      patient:patients (
        id,
        patient_number,
        full_name,
        phone
      )
    `)
    .single();

  if (appError) {
    return { success: false, error: appError.message };
  }

  // 2. Generate a session token only when a clinic session is active
  let token: { token_num: string; queue_pos: number; id?: string } | null = null;
  if (activeSession) {
    try {
      const { nextPos, tokenNumber } = await getNextSessionToken(
        supabase,
        result.data.appointment_date,
        activeSession.shift
      );

      const { data: insertedToken } = await supabase
        .from("tokens")
        .insert({
          appointment_id: appointment.id,
          token_number: tokenNumber,
          token_date: result.data.appointment_date,
          queue_position: nextPos,
        })
        .select()
        .single();

      if (insertedToken) {
        token = {
          id: insertedToken.id,
          token_num: insertedToken.token_number,
          queue_pos: insertedToken.queue_position,
        };
      }
    } catch (fallbackErr) {
      console.error("Token generation error:", fallbackErr);
    }
  }

  await logAudit("CREATE_APPOINTMENT", "appointments", appointment.id, {
    date: result.data.appointment_date,
    time: result.data.appointment_time,
    token: token?.token_num,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/queue");
  revalidatePath("/appointments");
  revalidatePath("/patients");

  return {
    success: true,
    data: {
      ...appointment,
      token,
    },
  };
}

export async function fetchAppointmentsForDate(clinicDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clinicDate || "")) {
    return { success: false, error: "Invalid date", data: [] };
  }

  const data = await getTodayAppointments(clinicDate);
  return { success: true, data };
}

export async function searchAppointments(query: string) {
  if (!query || query.trim().length === 0) {
    return { success: true, data: [] };
  }

  const data = await searchAppointmentsAcrossDates(query);
  return { success: true, data };
}

export async function quickBookToken(formData: {
  full_name: string;
  phone?: string;
  appointment_date?: string;
  appointment_time?: string;
  service_id?: string;
}) {
  if (!formData.full_name || formData.full_name.trim().length === 0) {
    return { success: false, error: "Patient name is required" };
  }

  const supabase = await createClient();
  const today = formData.appointment_date || getTodayDateString();

  // 1. Find or create patient record (name & phone only)
  let patientId: string | null = null;
  const rawPhone = formData.phone?.trim() || "";

  if (rawPhone.length > 0) {
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("phone", rawPhone)
      .maybeSingle();
    if (existing) {
      patientId = existing.id;
    }
  }

  if (!patientId) {
    const phoneToSave = rawPhone.length > 0 ? rawPhone : `+92-${Date.now().toString().slice(-7)}`;
    const { data: newPat, error: patErr } = await supabase
      .from("patients")
      .insert({
        full_name: formData.full_name.trim(),
        phone: phoneToSave,
        gender: "female",
      })
      .select("id, full_name, patient_number")
      .single();

    if (patErr) {
      // If phone collision, find fallback
      const { data: fallback } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", phoneToSave)
        .maybeSingle();
      if (fallback) {
        patientId = fallback.id;
      } else {
        return { success: false, error: patErr.message };
      }
    } else {
      patientId = newPat.id;
    }
  }

  // 2. A clinic session must be started before any token can be issued
  const activeSession = await getActiveSessionForDate(supabase, today);
  if (!activeSession) {
    return {
      success: false,
      error: "Please start a clinic session (date & time) before issuing a token.",
    };
  }

  const { nextPos, sequence, tokenNumber } = await getNextSessionToken(
    supabase,
    today,
    activeSession.shift
  );

  // Calculate 5-minute slot time if time not explicitly set
  let calculatedTime = formData.appointment_time;
  if (!calculatedTime) {
    const now = new Date();
    // Add (sequence - 1) * 5 minutes from now
    const slotDate = new Date(now.getTime() + (sequence - 1) * 5 * 60000);
    const hrs = String(slotDate.getHours()).padStart(2, "0");
    const mins = String(slotDate.getMinutes()).padStart(2, "0");
    calculatedTime = `${hrs}:${mins}`;
  }

  // 3. Insert Appointment (status = waiting)
  const { data: appointment, error: appErr } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      appointment_date: today,
      appointment_time: calculatedTime,
      appointment_type: "walk_in",
      status: "waiting",
      notes: getShiftTag(activeSession.shift),
      ...(formData.service_id ? { service_id: formData.service_id } : {}),
    })
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      service:services (
        id,
        name,
        duration_minutes,
        price
      ),
      patient:patients (
        id,
        patient_number,
        full_name,
        phone
      )
    `)
    .single();

  if (appErr) {
    return { success: false, error: appErr.message };
  }

  // 4. Insert Token
  const { data: tokenRecord } = await supabase
    .from("tokens")
    .insert({
      appointment_id: appointment.id,
      token_number: tokenNumber,
      token_date: today,
      queue_position: nextPos,
    })
    .select()
    .single();

  const token = tokenRecord
    ? { token_num: tokenRecord.token_number, queue_pos: tokenRecord.queue_position }
    : { token_num: tokenNumber, queue_pos: nextPos };

  await logAudit("QUICK_TOKEN_BOOK", "appointments", appointment.id, {
    patient: formData.full_name,
    token: token.token_num,
    time: calculatedTime,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/queue");
  revalidatePath("/appointments");
  revalidatePath("/patients");

  return {
    success: true,
    data: {
      ...appointment,
      token,
    },
  };
}

export async function bookCallAppointment(formData: {
  full_name: string;
  phone?: string;
  appointment_date?: string;
  appointment_time: string;
  notes?: string;
  service_id?: string;
  is_online?: boolean;
}) {
  if (!formData.full_name || formData.full_name.trim().length === 0) {
    return { success: false, error: "Patient name is required" };
  }
  if (!formData.appointment_time || formData.appointment_time.trim().length === 0) {
    return { success: false, error: "Appointment time is required" };
  }

  const supabase = await createClient();

  // A clinic session must be started before any call appointment can be booked
  const activeSession = await getActiveSessionForDate(
    supabase,
    getTodayDateString()
  );
  if (!activeSession) {
    return {
      success: false,
      error: "Please start a clinic session (date & time) before booking a call appointment.",
    };
  }

  const dateToUse = formData.appointment_date || getTodayDateString();
  const rawPhone = formData.phone?.trim() || "";

  // 1. Find or create patient record (skip lookup when no phone is provided)
  let patientId: string | null = null;
  if (rawPhone) {
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("phone", rawPhone)
      .maybeSingle();

    if (existing) {
      patientId = existing.id;
    }
  }

  if (!patientId) {
    const { data: newPat, error: patErr } = await supabase
      .from("patients")
      .insert({
        full_name: formData.full_name.trim(),
        phone: rawPhone,
        gender: "female",
      })
      .select("id")
      .single();

    if (patErr) {
      return { success: false, error: patErr.message };
    }
    patientId = newPat.id;
  }

  // 2. Detect whether the is_online column is available yet (safe before migration)
  const wantsOnline = Boolean(formData.is_online);
  let supportsOnlineFlag = false;
  if (wantsOnline) {
    const { error: onlineProbeError } = await supabase
      .from("appointments")
      .select("is_online")
      .limit(1);
    supportsOnlineFlag = !onlineProbeError;
  }

  const baseNotes = formData.notes?.trim() || "Phone Call Appointment";
  const notesToSave =
    wantsOnline && !supportsOnlineFlag ? `[ONLINE] ${baseNotes}` : baseNotes;

  // 3. Insert Appointment as 'scheduled' without token yet
  const { data: appointment, error: appErr } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      appointment_date: dateToUse,
      appointment_time: formData.appointment_time,
      appointment_type: "scheduled",
      status: "waiting",
      notes: notesToSave,
      ...(wantsOnline && supportsOnlineFlag ? { is_online: true } : {}),
      ...(formData.service_id ? { service_id: formData.service_id } : {}),
    })
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      appointment_type,
      service:services (
        id,
        name,
        duration_minutes,
        price
      ),
      patient:patients (
        id,
        patient_number,
        full_name,
        phone
      )
    `)
    .single();

  if (appErr) {
    return { success: false, error: appErr.message };
  }

  await logAudit("BOOK_CALL_APPOINTMENT", "appointments", appointment.id, {
    patient: formData.full_name,
    phone: rawPhone,
    time: formData.appointment_time,
    date: dateToUse,
    is_online: wantsOnline,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/appointments");

  return { success: true, data: appointment };
}

export async function checkInCallAppointment(appointmentId: string) {
  const supabase = await createClient();

  // 1. Fetch appointment details
  const { data: app, error: fetchErr } = await supabase
    .from("appointments")
    .select("id, appointment_date, appointment_time, notes, patient:patients(full_name)")
    .eq("id", appointmentId)
    .single();

  if (fetchErr || !app) {
    return { success: false, error: fetchErr?.message || "Appointment not found" };
  }

  const today = app.appointment_date || getTodayDateString();

  // 2. A clinic session must be started before any token can be issued
  const activeSession = await getActiveSessionForDate(supabase, today);
  if (!activeSession) {
    return {
      success: false,
      error: "Please start a clinic session (date & time) before issuing a token.",
    };
  }

  const { nextPos, tokenNumber } = await getNextSessionToken(
    supabase,
    today,
    activeSession.shift
  );

  // 3. Insert Token
  const { data: tokenRecord, error: tokErr } = await supabase
    .from("tokens")
    .insert({
      appointment_id: app.id,
      token_number: tokenNumber,
      token_date: today,
      queue_position: nextPos,
    })
    .select()
    .single();

  if (tokErr) {
    return { success: false, error: tokErr.message };
  }

  // 4. Update appointment status to waiting with the session tag
  await supabase
    .from("appointments")
    .update({
      status: "waiting",
      notes: appendShiftTag(app.notes, activeSession.shift),
    })
    .eq("id", app.id);

  await logAudit("CHECKIN_CALL_PATIENT", "appointments", app.id, {
    token: tokenRecord.token_number,
    queue_position: nextPos,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");

  return {
    success: true,
    data: {
      token_number: tokenRecord.token_number,
      queue_position: nextPos,
    },
  };
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const supabase = await createClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select(`
      id,
      status,
      patient:patients (full_name)
    `)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await logAudit("UPDATE_STATUS", "appointments", appointmentId, { new_status: status });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/queue");
  return { success: true, data: appointment };
}

// -----------------------------------------------------------------------------
// 3. CONSULTATION ACTIONS (DOCTOR ONLY)
// -----------------------------------------------------------------------------
export async function startConsultation(appointmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // Set appointment status to in_consultation
  const { error: appErr } = await supabase
    .from("appointments")
    .update({ status: "in_consultation" })
    .eq("id", appointmentId);

  if (appErr) return { success: false, error: appErr.message };

  // Upsert consultation record
  const { data: consultation, error: consErr } = await supabase
    .from("consultations")
    .upsert(
      {
        appointment_id: appointmentId,
        doctor_id: user.id,
        started_at: new Date().toISOString(),
      },
      { onConflict: "appointment_id" }
    )
    .select()
    .single();

  if (consErr) return { success: false, error: consErr.message };

  await logAudit("START_CONSULTATION", "consultations", consultation.id, { appointmentId });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/queue");
  return { success: true, data: consultation };
}

export async function completeConsultation(formData: unknown) {
  const result = consultationSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Validation failed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // 1. Upsert Consultation record
  const { data: consultation, error: consErr } = await supabase
    .from("consultations")
    .upsert(
      {
        appointment_id: result.data.appointment_id,
        doctor_id: user.id,
        completed_at: new Date().toISOString(),
        doctor_notes: result.data.doctor_notes?.trim() || null,
        treatment_notes: result.data.treatment_notes || null,
        follow_up_date: result.data.follow_up_date || null,
      },
      { onConflict: "appointment_id" }
    )
    .select()
    .single();

  if (consErr) return { success: false, error: consErr.message };

  // 2. Set appointment status to completed
  const { error: appErr } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", result.data.appointment_id);

  if (appErr) return { success: false, error: appErr.message };

  await logAudit("COMPLETE_CONSULTATION", "consultations", consultation.id, {
    appointmentId: result.data.appointment_id,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/queue");
  revalidatePath("/history");
  revalidatePath("/reports");
  return { success: true, data: consultation };
}

export async function saveConsultationNotes(formData: unknown) {
  const result = consultationSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Validation failed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: consultation, error: consErr } = await supabase
    .from("consultations")
    .upsert(
      {
        appointment_id: result.data.appointment_id,
        doctor_id: user.id,
        doctor_notes: result.data.doctor_notes?.trim() || null,
        follow_up_date: result.data.follow_up_date || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "appointment_id" }
    )
    .select()
    .single();

  if (consErr) return { success: false, error: consErr.message };

  await logAudit("SAVE_CONSULTATION_NOTES", "consultations", consultation.id, {
    appointmentId: result.data.appointment_id,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/history");
  revalidatePath("/reports");
  return { success: true, data: consultation };
}

export async function completeConsultationDirect(appointmentId: string, notes?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // 1. Upsert Consultation record (preserve existing doctor notes unless new ones are provided)
  const payload: {
    appointment_id: string;
    doctor_id: string;
    completed_at: string;
    doctor_notes?: string | null;
  } = {
    appointment_id: appointmentId,
    doctor_id: user.id,
    completed_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    payload.doctor_notes = notes.trim() || null;
  }

  const { data: consultation, error: consErr } = await supabase
    .from("consultations")
    .upsert(payload, { onConflict: "appointment_id" })
    .select()
    .maybeSingle();

  if (consErr) return { success: false, error: consErr.message };

  // 2. Set appointment status to completed
  const { error: appErr } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appointmentId);

  if (appErr) return { success: false, error: appErr.message };

  await logAudit("COMPLETE_CONSULTATION", "consultations", consultation?.id || null, {
    appointmentId,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/queue");
  revalidatePath("/history");
  revalidatePath("/reports");
  return { success: true, data: consultation };
}

// -----------------------------------------------------------------------------
// 4. CLINIC DAY & SESSION WORKFLOW
// -----------------------------------------------------------------------------
export async function startSession(formData: {
  shift: ClinicShift;
  session_date: string;
  start_time: string;
}) {
  if (!isClinicShift(formData.shift)) {
    return { success: false, error: "Please select Morning or Evening session." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.session_date || "")) {
    return { success: false, error: "Please select a valid session date." };
  }
  if (!/^\d{2}:\d{2}$/.test(formData.start_time || "")) {
    return { success: false, error: "Please select a valid start time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const notes = await readClinicNotes(supabase, formData.session_date);
  const session: ActiveSession = {
    shift: formData.shift,
    date: formData.session_date,
    start_time: formData.start_time,
    started_at: new Date().toISOString(),
    started_by: user?.id || null,
  };

  notes.active_session = session;

  const { data: clinicDay, error } = await supabase
    .from("clinic_days")
    .upsert(
      {
        clinic_date: formData.session_date,
        status: "open",
        closed_at: null,
        closed_by: null,
        notes: serializeClinicNotes(notes),
      },
      { onConflict: "clinic_date" }
    )
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAudit("START_SESSION", "clinic_days", clinicDay.id, {
    clinicDate: formData.session_date,
    shift: formData.shift,
    start_time: formData.start_time,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/queue");
  revalidatePath("/appointments");
  revalidatePath("/history");
  return { success: true, data: session };
}

export async function endSession(clinicDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const notes = await readClinicNotes(supabase, clinicDate);
  const session = notes.active_session as ActiveSession | undefined;

  if (!session || !isClinicShift(session.shift)) {
    return { success: false, error: "No active session to end." };
  }

  notes.active_session = null;
  notes.last_session = {
    ...session,
    ended_at: new Date().toISOString(),
    ended_by: user?.id || null,
  };

  const { data: clinicDay, error } = await supabase
    .from("clinic_days")
    .upsert(
      {
        clinic_date: clinicDate,
        notes: serializeClinicNotes(notes),
      },
      { onConflict: "clinic_date" }
    )
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAudit("END_SESSION", "clinic_days", clinicDay.id, {
    clinicDate,
    shift: session.shift,
    start_time: session.start_time,
  });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/queue");
  revalidatePath("/appointments");
  revalidatePath("/history");
  return { success: true, data: notes.last_session };
}

export async function closeClinicDay(clinicDate: string, notes?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const existingNotes = await readClinicNotes(supabase, clinicDate);
  existingNotes.active_session = null;
  if (notes?.trim()) {
    existingNotes.closing_notes = notes.trim();
  }

  const { data: clinicDay, error } = await supabase
    .from("clinic_days")
    .upsert(
      {
        clinic_date: clinicDate,
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: user?.id || null,
        notes: serializeClinicNotes(existingNotes),
      },
      { onConflict: "clinic_date" }
    )
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAudit("CLOSE_CLINIC_DAY", "clinic_days", clinicDay.id, { clinicDate });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/history");
  return { success: true, data: clinicDay };
}

export async function reopenClinicDay(clinicDate: string) {
  const supabase = await createClient();

  const existingNotes = await readClinicNotes(supabase, clinicDate);
  existingNotes.active_session = null;

  const { data: clinicDay, error } = await supabase
    .from("clinic_days")
    .update({
      status: "open",
      closed_at: null,
      closed_by: null,
      notes: serializeClinicNotes(existingNotes),
    })
    .eq("clinic_date", clinicDate)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAudit("REOPEN_CLINIC_DAY", "clinic_days", clinicDay.id, { clinicDate });

  revalidatePath("/doctor");
  revalidatePath("/operator");
  revalidatePath("/history");
  return { success: true, data: clinicDay };
}

// -----------------------------------------------------------------------------
// 5. SERVICES MANAGEMENT
// -----------------------------------------------------------------------------
export async function createOrUpdateService(formData: unknown, serviceId?: string) {
  const result = serviceSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Validation failed" };
  }

  const supabase = await createClient();

  if (serviceId) {
    const { data, error } = await supabase
      .from("services")
      .update(result.data)
      .eq("id", serviceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    await logAudit("UPDATE_SERVICE", "services", serviceId, { name: result.data.name });
    revalidatePath("/services");
    revalidatePath("/settings");
    revalidatePath("/doctor");
    revalidatePath("/operator");
    revalidatePath("/", "layout");
    return { success: true, data };
  } else {
    const { data, error } = await supabase
      .from("services")
      .insert(result.data)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    await logAudit("CREATE_SERVICE", "services", data.id, { name: result.data.name });
    revalidatePath("/services");
    revalidatePath("/settings");
    revalidatePath("/doctor");
    revalidatePath("/operator");
    revalidatePath("/", "layout");
    return { success: true, data };
  }
}

// -----------------------------------------------------------------------------
// 6. OPERATOR MANAGEMENT (DOCTOR ONLY)
// -----------------------------------------------------------------------------
export async function createOperatorUser(formData: unknown) {
  const result = operatorSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Validation failed" };
  }

  try {
    const acting = await getActingStaffProfile();
    if (!acting || acting.role !== "doctor") {
      return { success: false, error: "Only doctors can manage staff accounts." };
    }

    const adminSupabase = createAdminClient();

    const assignedRole = (result.data.role as "doctor" | "operator") || "operator";

    // Create user via Supabase Admin Auth
    const { data: userRecord, error: authError } = await adminSupabase.auth.admin.createUser({
      email: result.data.email,
      password: result.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: result.data.full_name,
        role: assignedRole,
      },
    });

    if (authError) return { success: false, error: authError.message };

    // Update profile
    await adminSupabase.from("profiles").upsert({
      id: userRecord.user.id,
      full_name: result.data.full_name,
      email: result.data.email,
      phone: result.data.phone || null,
      role: assignedRole,
      is_active: result.data.is_active,
    });

    await logAudit("CREATE_OPERATOR", "profiles", userRecord.user.id, {
      email: result.data.email,
      name: result.data.full_name,
    });

    revalidatePath("/operators");
    return { success: true, data: userRecord.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create operator";
    return { success: false, error: message };
  }
}

export async function toggleOperatorStatus(profileId: string, isActive: boolean) {
  const acting = await getActingStaffProfile();
  if (!acting || acting.role !== "doctor") {
    return { success: false, error: "Only doctors can manage staff accounts." };
  }
  if (acting.id === profileId) {
    return { success: false, error: "You cannot change your own staff status." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();

  if (isHeadDoctorEmail(target?.email)) {
    return { success: false, error: "The head doctor account cannot be modified." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logAudit("TOGGLE_OPERATOR_STATUS", "profiles", profileId, { is_active: isActive });
  revalidatePath("/operators");
  return { success: true, data };
}

export async function deleteOperatorUser(profileId: string) {
  try {
    const acting = await getActingStaffProfile();
    if (!acting || acting.role !== "doctor") {
      return { success: false, error: "Only doctors can manage staff accounts." };
    }
    if (acting.id === profileId) {
      return { success: false, error: "You cannot delete your own account." };
    }

    const adminSupabase = createAdminClient();
    const { data: target } = await adminSupabase
      .from("profiles")
      .select("email")
      .eq("id", profileId)
      .maybeSingle();

    if (!target) {
      return { success: false, error: "Staff account not found." };
    }

    if (isHeadDoctorEmail(target.email)) {
      return { success: false, error: "The head doctor account cannot be deleted." };
    }

    const { data: headDoctor } = await adminSupabase
      .from("profiles")
      .select("id")
      .ilike("email", HEAD_DOCTOR_EMAIL)
      .maybeSingle();

    if (!headDoctor) {
      return { success: false, error: "Head doctor account not found. Cannot transfer data." };
    }

    // Move clinical history to the head doctor before deleting the account
    const { error: consultationError } = await adminSupabase
      .from("consultations")
      .update({ doctor_id: headDoctor.id })
      .eq("doctor_id", profileId);

    if (consultationError) {
      return { success: false, error: consultationError.message };
    }

    const { error: appointmentError } = await adminSupabase
      .from("appointments")
      .update({ doctor_id: headDoctor.id })
      .eq("doctor_id", profileId);

    if (appointmentError) {
      return { success: false, error: appointmentError.message };
    }

    // Delete auth user (profile is removed by the auth.users cascade)
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(profileId);

    if (authError) {
      const { error: profileError } = await adminSupabase
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (profileError) {
        return { success: false, error: authError.message };
      }
    }

    await logAudit("DELETE_OPERATOR", "profiles", profileId, { profileId });
    revalidatePath("/operators");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete staff account";
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// 7. CLINIC SETTINGS
// -----------------------------------------------------------------------------
export async function updateClinicSettings(formData: unknown, settingsId?: string) {
  const result = clinicSettingsSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Validation failed" };
  }

  try {
    const adminSupabase = createAdminClient();

    // Check if there is an existing settings row
    let targetId = settingsId;
    if (!targetId) {
      const { data: existing } = await adminSupabase
        .from("clinic_settings")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        targetId = existing.id;
      }
    }

    const payload = {
      clinic_name: result.data.clinic_name.trim(),
      tagline: result.data.tagline?.trim() || null,
      phone: result.data.phone?.trim() || null,
      email: result.data.email?.trim() || null,
      address: result.data.address?.trim() || null,
      token_prefix: result.data.token_prefix?.trim() || "T-",
      opening_time: result.data.opening_time?.trim() || null,
      closing_time: result.data.closing_time?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let savedData;
    if (targetId) {
      const { data, error } = await adminSupabase
        .from("clinic_settings")
        .update(payload)
        .eq("id", targetId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      savedData = data;
    } else {
      const { data, error } = await adminSupabase
        .from("clinic_settings")
        .insert(payload)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      savedData = data;
    }

    await logAudit("UPDATE_SETTINGS", "clinic_settings", savedData.id, result.data);

    // Revalidate all pages so Header, Operator, and Doctor screens update clinic name immediately
    revalidatePath("/", "layout");
    revalidatePath("/doctor");
    revalidatePath("/operator");
    revalidatePath("/appointments");
    revalidatePath("/settings");

    return { success: true, data: savedData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update clinic settings";
    return { success: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// 8. DOCTOR BREAK MANAGEMENT (Tea Break, Namaz Break, Meal Break, etc.)
// -----------------------------------------------------------------------------
export async function setDoctorBreak(
  clinicDate: string,
  breakType: string,
  customReason?: string
) {
  try {
    const admin = createAdminClient();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const now = new Date();
    const started_time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const breakData = {
      on_break: true,
      break_type: breakType,
      custom_reason: customReason?.trim() || undefined,
      started_at: now.toISOString(),
      started_time,
      doctor_name: user?.user_metadata?.full_name || "Doctor",
    };

    // Fetch existing day or initialize
    const { data: existingDay } = await admin
      .from("clinic_days")
      .select("*")
      .eq("clinic_date", clinicDate)
      .maybeSingle();

    let existingNotesObj: Record<string, unknown> = {};
    if (existingDay?.notes) {
      try {
        existingNotesObj = JSON.parse(existingDay.notes);
      } catch {
        existingNotesObj = { text_notes: existingDay.notes };
      }
    }

    existingNotesObj.doctor_break = breakData;

    const { data: updatedDay, error } = await admin
      .from("clinic_days")
      .upsert(
        {
          clinic_date: clinicDate,
          status: existingDay?.status || "open",
          notes: JSON.stringify(existingNotesObj),
        },
        { onConflict: "clinic_date" }
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit("DOCTOR_START_BREAK", "clinic_days", updatedDay.id, breakData);

    revalidatePath("/doctor");
    revalidatePath("/operator");

    return { success: true, data: breakData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to set doctor break";
    return { success: false, error: msg };
  }
}

export async function endDoctorBreak(clinicDate: string) {
  try {
    const admin = createAdminClient();

    const { data: existingDay } = await admin
      .from("clinic_days")
      .select("*")
      .eq("clinic_date", clinicDate)
      .maybeSingle();

    let existingNotesObj: Record<string, unknown> = {};
    if (existingDay?.notes) {
      try {
        existingNotesObj = JSON.parse(existingDay.notes);
      } catch {
        existingNotesObj = { text_notes: existingDay.notes };
      }
    }

    existingNotesObj.doctor_break = {
      on_break: false,
      ended_at: new Date().toISOString(),
    };

    const { data: updatedDay, error } = await admin
      .from("clinic_days")
      .upsert(
        {
          clinic_date: clinicDate,
          status: existingDay?.status || "open",
          notes: JSON.stringify(existingNotesObj),
        },
        { onConflict: "clinic_date" }
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit("DOCTOR_END_BREAK", "clinic_days", updatedDay.id, {});

    revalidatePath("/doctor");
    revalidatePath("/operator");

    return { success: true, data: { on_break: false } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to end doctor break";
    return { success: false, error: msg };
  }
}

// 9. PROCEDURES & CLINICAL TREATMENTS
export async function assignAppointmentProcedure(appointmentId: string, serviceId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .update({ service_id: serviceId })
      .eq("id", appointmentId)
      .select(`
        *,
        service:services (id, name, duration_minutes, price),
        patient:patients (id, patient_number, full_name, phone)
      `)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/doctor");
    revalidatePath("/operator");
    revalidatePath("/procedures");
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not update procedure";
    return { success: false, error: msg };
  }
}

export async function updateServicePrice(serviceId: string, price: number) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .update({ price })
      .eq("id", serviceId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/doctor");
    revalidatePath("/operator");
    revalidatePath("/procedures");
    revalidatePath("/services");
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not update price";
    return { success: false, error: msg };
  }
}

export async function createProcedure(name: string, price: number) {
  try {
    if (!name || !name.trim()) {
      return { success: false, error: "Procedure name is required" };
    }
    const cleanPrice = Number(price) || 0;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .insert({
        name: name.trim(),
        price: cleanPrice,
        duration_minutes: 30,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    revalidatePath("/procedures");
    revalidatePath("/doctor");
    revalidatePath("/operator");
    revalidatePath("/appointments");
    revalidatePath("/", "layout");
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not create procedure";
    return { success: false, error: msg };
  }
}

export async function updateProcedure(serviceId: string, name: string, price: number) {
  try {
    if (!name || !name.trim()) {
      return { success: false, error: "Procedure name is required" };
    }
    const cleanPrice = Number(price) || 0;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .update({
        name: name.trim(),
        price: cleanPrice,
        is_active: true,
      })
      .eq("id", serviceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    revalidatePath("/procedures");
    revalidatePath("/doctor");
    revalidatePath("/operator");
    revalidatePath("/appointments");
    revalidatePath("/", "layout");
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not update procedure";
    return { success: false, error: msg };
  }
}

export async function deleteProcedure(serviceId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (error) {
      const { error: updateErr } = await supabase
        .from("services")
        .update({ is_active: false })
        .eq("id", serviceId);

      if (updateErr) return { success: false, error: updateErr.message };
    }

    revalidatePath("/settings");
    revalidatePath("/procedures");
    revalidatePath("/doctor");
    revalidatePath("/operator");
    revalidatePath("/appointments");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove procedure";
    return { success: false, error: msg };
  }
}


