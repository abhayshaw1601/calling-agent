import { withAuth } from 'next-auth/middleware';

export default withAuth({
    pages: {
        signIn: '/login', // Redirect here if not authenticated
    },
});

// Define which paths you want to protect (e.g. all pages except login, api, and static files)
export const config = {
    matcher: [
        /*  
         * Match all request paths except for:
         * - api/auth (NextAuth endpoints)
         * - login (custom login page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
    ],
};
