import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isUserAdmin } from "@/lib/auth/role-check";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.trim() !== "" &&
    supabaseAnonKey.trim() !== "" &&
    supabaseUrl !== "https://placeholder-project.supabase.co" &&
    supabaseAnonKey !== "placeholder-anon-key" &&
    supabaseUrl.startsWith("http")
  );

  const pathname = request.nextUrl.pathname;

  // 1. Local Development Mode Authorization Guard
  if (!isConfigured) {
    const protectedRoutes = ["/admin", "/account", "/checkout"];
    const demoCookieRaw = request.cookies.get("demo_user")?.value;
    let demoUser: { email?: string; role?: string; id?: string } | null = null;
    if (demoCookieRaw) {
      try {
        const decoded = decodeURIComponent(demoCookieRaw);
        demoUser = JSON.parse(decoded);
      } catch {
        try {
          demoUser = JSON.parse(demoCookieRaw);
        } catch {
          demoUser = null;
        }
      }
    }

    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      if (!demoUser) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Strict RBAC for /admin sub-routes
      if (pathname.startsWith("/admin") && !isUserAdmin(demoUser)) {
        const forbiddenUrl = new URL("/403", request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }
    return supabaseResponse;
  }

  // 2. Production / Cloud Supabase Mode Authorization Guard
  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth session
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  // Strict Admin route protection (/admin and /admin/*)
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check at middleware edge from public.users
    let dbProfile: { role?: string; id?: string } | null = null;
    try {
      const { data, error: profileErr } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single();
      if (profileErr) {
        console.error("Middleware profile fetch failed:", profileErr);
      }
      dbProfile = data;
    } catch {
      // AdminLayout will perform authoritative fallback check
    }

    const profile = dbProfile;
    // Enforces strict RBAC: rejects if role !== "admin"
    if (!isUserAdmin(user, profile)) {
      const forbiddenUrl = new URL("/403", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // Authenticated user routes protection (/account, /checkout)
  const protectedRoutes = ["/account", "/checkout"];
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
