import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith('/dashboard') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  },
  {
    callbacks: {
      // Always authorized so the proxy function above runs even without a
      // token; unauthenticated users get redirected to `/` there instead of
      // the NextAuth signin page, matching app/dashboard/layout.tsx.
      authorized: () => true,
    },
  },
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
