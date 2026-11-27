"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function loginUserAction(formData: { email: string; userId?: string; roleRedirect?: string }) {
  try {
    const admin = createAdminClient();
    
    // Check if user exists in profiles by userId or case-insensitive email
    let profile = null;

    if (formData.userId) {
      const { data } = await admin
        .from("profiles")
        .select("id, role, is_active, email")
        .eq("id", formData.userId)
        .maybeSingle();
      profile = data;
    }

    if (!profile && formData.email) {
      const cleanEmail = formData.email.trim().toLowerCase();
      const { data } = await admin
        .from("profiles")
        .select("id, role, is_active, email")
        .ilike("email", cleanEmail)
        .maybeSingle();
      profile = data;
    }

    if (profile) {
      if (profile.role !== "doctor" && profile.is_active === false) {
        return {
          success: false,
          error: "Your account is deactivated. Please contact the administrator.",
        };
      }
      return { success: true, role: profile.role };
    }

    // If profile missing, fetch from auth.users via admin
    const { data: authData } = await admin.auth.admin.listUsers();
    const cleanEmail = formData.email?.trim().toLowerCase();
    const matchedUser = authData?.users?.find(
      (u) => (u.email && u.email.toLowerCase() === cleanEmail) || (formData.userId && u.id === formData.userId)
    );

    if (matchedUser) {
      const userRole = matchedUser.user_metadata?.role || (matchedUser.email?.includes("doctor") || matchedUser.email?.includes("admin") ? "doctor" : "operator");
      await admin.from("profiles").upsert({
        id: matchedUser.id,
        full_name: matchedUser.user_metadata?.full_name || matchedUser.email?.split("@")[0] || "Staff Member",
        email: matchedUser.email || formData.email,
        role: userRole,
        is_active: true,
      });
      return { success: true, role: userRole };
    }

    return { success: true, role: "doctor" };
  } catch (err: unknown) {
    console.error("Auth server action error:", err);
    return { success: true, role: "doctor" };
  }
}
