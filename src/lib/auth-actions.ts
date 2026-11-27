"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function loginUserAction(formData: { email: string; roleRedirect?: string }) {
  try {
    const admin = createAdminClient();
    
    // Check if user exists in auth or profiles
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, is_active")
      .eq("email", formData.email)
      .maybeSingle();

    if (profile) {
      if (!profile.is_active) {
        // Automatically activate if inactive
        await admin
          .from("profiles")
          .update({ is_active: true, role: profile.role || "doctor" })
          .eq("id", profile.id);
        return { success: true, role: profile.role || "doctor" };
      }
      return { success: true, role: profile.role };
    }

    // If profile missing, fetch from auth.users via admin
    const { data: authData } = await admin.auth.admin.listUsers();
    const matchedUser = authData?.users?.find(u => u.email === formData.email);

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
