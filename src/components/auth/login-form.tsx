"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginUserAction } from "@/lib/auth-actions";
import { resetMainDoctorPassword } from "@/lib/actions";
import {
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Key,
} from "lucide-react";

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

  // Main Doctor Forgot Password states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("doctor@clinic.com");
  const [masterKey, setMasterKey] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotErrorMessage, setForgotErrorMessage] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotErrorMessage(null);
    setForgotSuccessMessage(null);
    setEmailSentNotice(null);

    try {
      const res = await resetMainDoctorPassword({
        email: forgotEmail,
        masterKey,
        newPassword: forgotNewPassword,
      });

      if (res.success) {
        setForgotSuccessMessage("Password reset successfully! You can now sign in with your new password.");
        setTimeout(() => {
          setIsForgotOpen(false);
          setForgotSuccessMessage(null);
          setMasterKey("");
          setForgotNewPassword("");
        }, 2000);
      } else {
        setForgotErrorMessage(res.error || "Password reset failed");
      }
    } catch {
      setForgotErrorMessage("An error occurred during password reset.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!forgotEmail) return;
    setIsSendingEmail(true);
    setEmailSentNotice(null);
    setForgotErrorMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        setForgotErrorMessage(error.message);
      } else {
        setEmailSentNotice(`Reset email link dispatched to ${forgotEmail}. Please check your inbox.`);
      }
    } catch {
      setForgotErrorMessage("Failed to send reset email link.");
    } finally {
      setIsSendingEmail(false);
    }
  };

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F3E3A3] flex items-center justify-center shadow-lg shadow-[#D4AF37]/40 border border-[#F3E3A3]/70 flex-shrink-0">
            <span className="font-serif text-2xl font-bold text-[#12100E] italic tracking-tighter">G</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-serif font-black tracking-tight text-[#FAF7F2] leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]">
              Glow Derm
            </h1>
            <p className="text-xs sm:text-[13px] text-[#E5C158] font-black tracking-wider uppercase mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]">
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

          {isForgotOpen ? (
            <div>
              <div className="relative z-10 mb-5 border-b border-[#1A120B]/10 pb-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#8A6338] hover:text-[#1A120B] font-bold mb-2 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>
                <h2 className="text-lg sm:text-xl font-black text-[#1A120B] flex items-center justify-center gap-2">
                  <KeyRound className="w-6 h-6 text-[#8A6338]" />
                  Reset Password
                </h2>
                <p className="text-xs sm:text-sm text-[#2B1E14] mt-1 font-bold">
                  Enter your clinic credentials to set a new password
                </p>
              </div>

              {forgotErrorMessage && (
                <div className="relative z-10 mb-4 p-3.5 rounded-2xl bg-[#FEF2F2]/90 backdrop-blur-md border border-[#FECACA] text-[#B91C1C] text-xs sm:text-sm font-bold flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" />
                  <span>{forgotErrorMessage}</span>
                </div>
              )}

              {forgotSuccessMessage && (
                <div className="relative z-10 mb-4 p-3.5 rounded-2xl bg-[#ECFDF5]/90 backdrop-blur-md border border-[#A7F3D0] text-[#065F46] text-xs sm:text-sm font-bold flex items-start gap-2 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#059669] mt-0.5" />
                  <span>{forgotSuccessMessage}</span>
                </div>
              )}

              {emailSentNotice && (
                <div className="relative z-10 mb-4 p-3.5 rounded-2xl bg-[#EFF6FF]/90 backdrop-blur-md border border-[#BFDBFE] text-[#1E40AF] text-xs sm:text-sm font-bold flex items-start gap-2 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2563EB] mt-0.5" />
                  <span>{emailSentNotice}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="relative z-10 space-y-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-black text-[#1A120B] mb-1 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#8A6338]" />
                    Main Doctor Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    className="w-full bg-white/50 backdrop-blur-md border border-white/80 focus:border-[#8A6338] focus:bg-white/85 focus:ring-2 focus:ring-[#8A6338]/20 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-[#1A120B] font-bold outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-[#1A120B] mb-1 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#8A6338]" />
                    Clinic Master Recovery Key
                  </label>
                  <input
                    type="password"
                    required
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="Enter Clinic Recovery Key"
                    className="w-full bg-white/50 backdrop-blur-md border border-white/80 focus:border-[#8A6338] focus:bg-white/85 focus:ring-2 focus:ring-[#8A6338]/20 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-[#1A120B] font-bold outline-none transition"
                  />
                  <p className="text-[11px] text-[#6E5D4F] font-bold mt-1 ml-1">
                    Master key for clinic emergency recovery (default: <span className="font-mono text-[#1A120B]">glowderm123</span>)
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-[#1A120B] mb-1 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#8A6338]" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-white/50 backdrop-blur-md border border-white/80 focus:border-[#8A6338] focus:bg-white/85 focus:ring-2 focus:ring-[#8A6338]/20 rounded-2xl pl-4 pr-11 py-2.5 text-sm sm:text-base text-[#1A120B] font-bold outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5D4F] hover:text-[#1A120B] p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showForgotNewPassword ? (
                        <EyeOff className="w-4 h-4 text-[#8A6338]" />
                      ) : (
                        <Eye className="w-4 h-4 text-[#8A6338]" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full mt-3 py-3 rounded-2xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] text-sm sm:text-base font-black shadow-lg shadow-[#1E1915]/25 transition flex items-center justify-center gap-2 border border-[#2B1E14]"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#D8C5AD]" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-[#D8C5AD]" />
                      Set New Password
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={isSendingEmail || !forgotEmail}
                    className="text-xs text-[#8A6338] hover:text-[#1A120B] font-bold underline transition inline-flex items-center gap-1"
                  >
                    {isSendingEmail ? "Sending reset link..." : "Or send Supabase reset email link"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
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
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email"
                    autoComplete="off"
                    className="w-full bg-white/50 backdrop-blur-md border border-white/80 focus:border-[#8A6338] focus:bg-white/85 focus:ring-2 focus:ring-[#8A6338]/20 rounded-2xl px-4 py-3.5 text-base sm:text-lg text-[#1E1915] font-bold placeholder-[#6E5D4F] outline-none transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-black text-[#1A120B] flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#8A6338]" />
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotOpen(true);
                        setForgotErrorMessage(null);
                        setForgotSuccessMessage(null);
                        setEmailSentNotice(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-[#2B1E14] hover:text-[#5C3D1E] font-bold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      autoComplete="off"
                      className="w-full bg-white/50 backdrop-blur-md border border-white/80 focus:border-[#8A6338] focus:bg-white/85 focus:ring-2 focus:ring-[#8A6338]/20 rounded-2xl pl-4 pr-12 py-3.5 text-base sm:text-lg text-[#1E1915] font-bold placeholder-[#6E5D4F] outline-none transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
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
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
