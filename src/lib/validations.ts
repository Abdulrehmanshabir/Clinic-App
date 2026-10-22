import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const patientSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^[+0-9\s\-()]+$/, "Invalid phone number format"),
  gender: z.enum(["male", "female", "other"]),
  date_of_birth: z.string().optional().nullable(),
  age: z.number().min(0).max(130).optional().nullable(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const appointmentSchema = z.object({
  patient_id: z.string().uuid("Please select a valid patient"),
  doctor_id: z.string().uuid().optional().nullable(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  appointment_time: z.string().min(1, "Please select appointment time"),
  service_id: z.string().uuid().optional().nullable(),
  appointment_type: z.enum(["scheduled", "walk_in"]),
  notes: z.string().optional().or(z.literal("")),
});

export const consultationSchema = z.object({
  appointment_id: z.string().uuid(),
  doctor_notes: z.string().optional().or(z.literal("")),
  treatment_notes: z.string().optional().or(z.literal("")),
  follow_up_date: z.string().optional().nullable(),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().optional().or(z.literal("")),
  duration_minutes: z.number().min(5, "Minimum duration is 5 minutes"),
  price: z.number().min(0, "Price cannot be negative"),
  is_active: z.boolean(),
});

export const operatorSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
  is_active: z.boolean(),
});

export const clinicSettingsSchema = z.object({
  clinic_name: z.string().min(2, "Clinic name is required"),
  tagline: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  token_prefix: z.string().min(1, "Token prefix is required"),
  opening_time: z.string().optional().or(z.literal("")),
  closing_time: z.string().optional().or(z.literal("")),
});
