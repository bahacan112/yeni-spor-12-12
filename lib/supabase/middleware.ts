import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const mustChange = Boolean((user as any)?.user_metadata?.must_change_password);
    const p = request.nextUrl.pathname;
    if (mustChange && p !== "/dashboard/force-password") {
      return NextResponse.redirect(new URL("/dashboard/force-password", request.url));
    }
  }

  // Protect dashboard and admin routes
  if (
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/admin")) &&
    !user
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/dashboard") && user) {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("role, tenant:tenants(subscription_status)")
        .eq("id", user.id)
        .single();
      const role = (userData as any)?.role;
      const subStatus = (userData as any)?.tenant?.subscription_status;
      if (role !== "super_admin" && subStatus === "inactive") {
        return NextResponse.redirect(new URL("/auth/logout", request.url));
      }
    } catch {}
  }

  // Enforce super_admin for all /admin routes
  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!userData || userData.role !== "super_admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {}
  }

  // Redirect to dashboard if logged in and trying to access auth pages
  if (
    request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/auth/logout") &&
    user
  ) {
    // Check if user is super_admin (this is a bit tricky in middleware without database access)
    // So we rely on the client-side redirect or the dashboard page to handle it.
    // However, to be safe, we redirect to dashboard, and dashboard will handle redirection to admin if needed.
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect root to dashboard if logged in, otherwise let it pass (landing page)
  // or redirect to login if you want root to be protected
  // if (request.nextUrl.pathname === '/' && user) {
  //    return NextResponse.redirect(new URL('/dashboard', request.url))
  // }

  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api");
  const isDashboard =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isSitePath = pathname.startsWith("/site/");

  if (!isApi && !isDashboard && !isSitePath && host) {
    try {
      const domainUrl = new URL(`/api/public/domain/${host}`, request.url);
      const res = await fetch(domainUrl, {
        headers: { "x-forwarded-host": host },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          slug: string;
          websiteEnabled: boolean;
        };
        if (data.websiteEnabled) {
          const rewriteTo = new URL(
            `/site/${data.slug}${pathname === "/" ? "" : pathname}`,
            request.url,
          );
          return NextResponse.rewrite(rewriteTo);
        }
      }
    } catch {}
  }

  return response;
}
