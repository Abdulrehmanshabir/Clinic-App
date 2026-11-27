import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Handle environment when keys are not yet configured during build/local initialization
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project")) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public paths
  const isAuthPage = pathname.startsWith("/login");
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico");

  if (isStaticAsset) {
    return response;
  }

  if (!user && !isAuthPage && pathname !== "/") {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage) {
    // Fetch profile role to redirect correctly
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role || (user.email?.toLowerCase().includes("operator") ? "operator" : "doctor");
    if (role === "operator") {
      return NextResponse.redirect(new URL("/operator", request.url));
    } else {
      return NextResponse.redirect(new URL("/doctor", request.url));
    }
  }

  // Doctor route protection
  if (user && pathname.startsWith("/doctor")) {
    let { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Doctor Admin",
          email: user.email || "",
          role: "doctor",
          is_active: true,
        })
        .select("role, is_active")
        .single();
      profile = newProfile;
    }

    if (!profile || !profile.is_active || profile.role !== "doctor") {
      return NextResponse.redirect(new URL("/operator", request.url));
    }
  }

  // Operator route protection
  if (user && pathname.startsWith("/operator")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && !profile.is_active) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  return response;
}
