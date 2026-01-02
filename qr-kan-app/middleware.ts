import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for static files, API routes, and SEO files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/sitemap') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Allow admin login page without auth check
  if (pathname === "/admin/login") {
    return await updateSession(req);
  }
  
  // Protect admin routes - check in the page itself for better error handling
  // Middleware will just ensure user is authenticated via Supabase
  if (pathname.startsWith("/admin")) {
    const supabaseResponse = await updateSession(req);
    // The actual admin check happens in the page component
    return supabaseResponse;
  }
  
  // Handle Supabase auth session
  const supabaseResponse = await updateSession(req);
  
  // If updateSession returned a redirect, use it (but check for loops)
  if (supabaseResponse.status === 307 || supabaseResponse.status === 308) {
    // Check if we're redirecting to the same path (potential loop)
    const location = supabaseResponse.headers.get('location');
    if (location && new URL(location, req.url).pathname === pathname) {
      // Potential loop detected, just continue without redirect
      return NextResponse.next();
    }
    return supabaseResponse;
  }
  
  // Support /@username → rewrite to /u/username while keeping URL in the bar
  if (pathname.startsWith("/@")) {
    const username = pathname.slice(2).split("/")[0];
    const rest = pathname.slice(2 + username.length); // preserve any trailing parts
    if (username.length > 0) {
      const url = req.nextUrl.clone();
      url.pathname = `/u/${username}${rest}`;
      // Copy cookies from supabase response
      const rewriteResponse = NextResponse.rewrite(url);
      supabaseResponse.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return rewriteResponse;
    }
  }
  
  return supabaseResponse;
}

export const config = {
  // Run on all paths; early return for non-@ routes keeps it cheap
  matcher: ["/:path*"],
};


