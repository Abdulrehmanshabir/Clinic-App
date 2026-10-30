"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginUserAction } from "@/lib/auth-actions";
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, Stethoscope, UserCheck, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === "account_deactivated"
      ? "Your account is deactivated. Please contact the administrator."
      : errorParam === "unauthorized"
      ? "You are not authorized to view this page."
      : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        try {
          const result = await loginUserAction({ email: data.user.email || email });
          const userRole = result?.role || (email.toLowerCase().includes("operator") ? "operator" : "doctor");
          const targetUrl = userRole === "operator" ? "/operator" : "/doctor";
          window.location.href = targetUrl;
        } catch {
          const targetUrl = email.toLowerCase().includes("operator") ? "/operator" : "/doctor";
          window.location.href = targetUrl;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during login";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Keep login screen in its pure original glassmorphic aesthetic
    try {
      document.documentElement.classList.remove("dark");
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col bg-[#FBF9F5] overflow-hidden login-page-card">
      {/* High-Resolution Aesthetic Clinic & Laser Interior Backdrop (Full View with Clinic Branding) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.85] bg-cover bg-no-repeat filter saturate-100 contrast-105 animate-luxury-bg"
          style={{
            backgroundImage: `url('/clinic-bg.png')`,
            backgroundPosition: "center 35%",
          }}
        />
      </div>

      {/* Very Subtle Ambient Glow */}
      <div className="absolute inset-0 bg-[#FBF9F5]/10 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-[#A8835A]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Full-Width Top Header Bar */}
      <header className="border-b border-[#E8DFD1]/40 bg-gradient-to-r from-[#C4A482] via-transparent to-transparent sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Clinic Brand - Seamless within Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2B1E14] to-[#4A3522] flex items-center justify-center shadow-lg shadow-[#2B1E14]/20 border border-[#6B4E31]/30 flex-shrink-0">
            <span className="font-serif text-2xl font-bold text-[#E9DFD1] italic tracking-tighter">G</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-serif font-black tracking-tight text-[#1A120B] leading-none">
              Glow Derm
            </h1>
            <p className="text-xs sm:text-[13px] text-[#8C6843] font-black tracking-wider uppercase mt-1">
              Expert Laser and Skin Clinic
            </p>
          </div>
        </div>

        {/* Right side remains completely transparent so background Glow Derm is fully visible */}
        <div className="flex-1 h-full" />
      </header>

      {/* Main Centered Login Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-20">
        <div className="w-full max-w-md my-auto animate-luxury-card">
        {/* Pure Water Glassmorphic Card Box */}
        <div className="relative bg-white/25 backdrop-blur-2xl border border-white/60 rounded-3xl p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.8)_inset] overflow-hidden">
          {/* Subtle water surface reflection highlight */}
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-white/40 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 mb-6 border-b border-[#1A120B]/10 pb-4 text-center">
            <h2 className="text-lg sm:text-xl font-black text-[#1A120B] flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#8A6338]" />
              Staff Portal Authentication
            </h2>
            <p className="text-sm text-[#2B1E14] mt-1.5 font-bold">
              Enter authorized doctor or receptionist credentials
            </p>
          </div>

          {errorMessage && (
            <div className="relative z-10 mb-5 p-3.5 rounded-2xl bg-[#FEF2F2]/90 backdrop-blur-md border border-[#FECACA] text-[#B91C1C] text-sm font-bold flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="relative z-10 space-y-4">
            <div>
              <label className="block text-sm font-black text-[#1A120B] mb-1.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8A6338]" />
                Staff Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email"
                className="w-full bg-white/50 backdrop-blur-md border border-white/80 focus:border-[#8A6338] focus:bg-white/85 focus:ring-2 focus:ring-[#8A6338]/20 rounded-2xl px-4 py-3.5 text-base sm:text-lg text-[#1A120B] font-bold placeholder-[#6E5D4F] outline-none transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#1A120B] mb-1.5 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#8A6338]" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-white/50 backdrop-blur-md border border-white/80 focus:border-[#8A6338] focus:bg-white/85 focus:ring-2 focus:ring-[#8A6338]/20 rounded-2xl pl-4 pr-12 py-3.5 text-base sm:text-lg text-[#1A120B] font-bold placeholder-[#6E5D4F] outline-none transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E5D4F] hover:text-[#1A120B] transition p-1 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-[#8A6338]" />
                  ) : (
                    <Eye className="w-5 h-5 text-[#8A6338]" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-2xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] text-base font-black shadow-lg shadow-[#1E1915]/25 transition flex items-center justify-center gap-2 border border-[#2B1E14] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#D8C5AD]" />
                  Authenticating...
                </>
              ) : (
                "Sign In to Clinic Console"
              )}
            </button>
          </form>

          {/* 1-Click Quick Demo Login */}
          <div className="relative z-10 mt-6 pt-5 border-t border-[#1A120B]/10 space-y-3">
            <p className="text-[11px] font-black text-[#2B1E14] text-center uppercase tracking-wider">
              Quick 1-Click Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEmail("doctor@clinic.com");
                  setPassword("doctor123");
                }}
                className="p-3 rounded-2xl bg-white/45 hover:bg-white/70 backdrop-blur-md border border-white/70 text-[#1A120B] text-xs font-black transition flex flex-col items-center gap-1 shadow-sm group"
              >
                <div className="flex items-center gap-1.5 text-[#8A6338]">
                  <Stethoscope className="w-4 h-4" />
                  <span className="font-black text-[#1A120B]">Doctor Login</span>
                </div>
                <span className="text-[11px] text-[#2B1E14] font-bold font-mono">doctor@clinic.com</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("operator@clinic.com");
                  setPassword("operator123");
                }}
                className="p-3 rounded-2xl bg-white/45 hover:bg-white/70 backdrop-blur-md border border-white/70 text-[#1A120B] text-xs font-black transition flex flex-col items-center gap-1 shadow-sm group"
              >
                <div className="flex items-center gap-1.5 text-[#8A6338]">
                  <UserCheck className="w-4 h-4" />
                  <span className="font-black text-[#1A120B]">Receptionist</span>
                </div>
                <span className="text-[11px] text-[#2B1E14] font-bold font-mono">operator@clinic.com</span>
              </button>
            </div>
            <p className="text-[11px] text-[#2B1E14] text-center font-bold">
              Demo credentials: <span className="font-mono text-[#1A120B] font-black underline decoration-[#8A6338]/40">doctor123 / operator123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
