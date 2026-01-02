import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    // Prevent redirect loop - check if we're not already on login page
    const isLoginPage = request.nextUrl.pathname === '/login'
    if (!isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      // Only set redirect param if not already set to prevent loops
      if (!url.searchParams.has('redirect')) {
        url.searchParams.set('redirect', request.nextUrl.pathname)
      }
      return NextResponse.redirect(url)
    }
    // If already on login page and no user, just continue
    return supabaseResponse
  }

  // Redirect logged-in users away from auth pages
  // Only redirect if user exists and we're on auth pages
  const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register'
  if (isAuthPage && user) {
    // Prevent redirect loop - check if redirect param exists and points to dashboard
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    if (redirectParam && redirectParam.startsWith('/dashboard')) {
      // User is trying to access dashboard, allow the redirect
      return supabaseResponse
    }
    // User is logged in and on auth page, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard/profile', request.url))
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}



