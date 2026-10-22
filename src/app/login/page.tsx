import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Staff Login | Glow & Derm Aesthetic & Dermatologist Clinic",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#8C7A6B]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
