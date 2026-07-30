import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Allow public access to landing page, login, signup, and static assets
        if (
          pathname === '/' ||
          pathname === '/login' ||
          pathname === '/signup' ||
          pathname.startsWith('/api/auth/signup') ||
          pathname.startsWith('/hero-mockup.png')
        ) {
          return true;
        }

        // Protect dashboard routes - requires a valid session token
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
