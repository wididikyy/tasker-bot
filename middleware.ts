import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Update Supabase auth session
  const response = await updateSession(request)
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register']
  
  // Check if the route is public
  if (publicRoutes.includes(pathname)) {
    return response
  }
  
  // Get the user from the session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // If there's no user and the route is not public, redirect to login
  if (!user && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
