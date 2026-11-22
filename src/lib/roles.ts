export const HEAD_DOCTOR_EMAIL = (
  process.env.HEAD_DOCTOR_EMAIL || "doctor@clinic.com"
)
  .trim()
  .toLowerCase();

export const CLINIC_MASTER_KEY = (
  process.env.CLINIC_MASTER_KEY || "glowderm123"
).trim();

export function isHeadDoctorEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === HEAD_DOCTOR_EMAIL;
}
