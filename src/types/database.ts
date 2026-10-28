export type UserRole = "doctor" | "operator";

export type AppointmentStatus =
  | "waiting"
  | "called"
  | "in_consultation"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentType = "scheduled" | "walk_in";

export type Gender = "male" | "female" | "other";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_number: string;
  full_name: string;
  phone: string;
  gender: Gender;
  date_of_birth?: string | null;
  age?: number | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  appointments?: Appointment[];
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicDay {
  id: string;
  clinic_date: string;
  status: "open" | "closed";
  opened_at: string;
  closed_at?: string | null;
  closed_by?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Token {
  id: string;
  appointment_id: string;
  token_number: string;
  token_date: string;
  queue_position: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  appointment_date: string;
  appointment_time: string;
  service_id?: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  is_online?: boolean | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Expanded joins:
  patient?: Patient;
  token?: Token;
  service?: Service;
  doctor?: Profile;
  consultation?: Consultation;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  doctor_id: string;
  started_at: string;
  completed_at?: string | null;
  doctor_notes?: string | null;
  treatment_notes?: string | null;
  follow_up_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface ClinicSettings {
  id: string;
  clinic_name: string;
  tagline?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  token_prefix: string;
  opening_time?: string | null;
  closing_time?: string | null;
  updated_at: string;
}

export interface QueueSummary {
  total: number;
  waiting: number;
  called: number;
  in_consultation: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

export interface DoctorBreakInfo {
  on_break: boolean;
  break_type: string;
  custom_reason?: string;
  started_at: string;
  started_time: string;
  doctor_name?: string;
}
