export const HEAD_DOCTOR_EMAIL = (
  process.env.NEXT_PUBLIC_HEAD_DOCTOR_EMAIL ||
  process.env.HEAD_DOCTOR_EMAIL ||
  "doctor@clinic.com"
)
  .trim()
  .toLowerCase();

export const CLINIC_MASTER_KEY = (
  process.env.CLINIC_MASTER_KEY || "glowderm123"
).trim();

export function isHeadDoctorEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === HEAD_DOCTOR_EMAIL || clean === "doctor@clinic.com";
}
