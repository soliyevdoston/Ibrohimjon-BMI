import { NextRequest, NextResponse } from 'next/server';

const protectedPanels = ['admin', 'seller', 'courier', 'customer'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const firstSegment = path.split('/').filter(Boolean)[0];

  if (!firstSegment || !protectedPanels.includes(firstSegment)) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get('role')?.value;
  const expectedRole = firstSegment.toUpperCase();

  // Dev ergonomics: if no role cookie, set one that matches the panel being visited.
  // Production gating should live on the backend; the cookie here is a UI hint only.
  if (!roleCookie) {
    const response = NextResponse.next();
    response.cookies.set('role', expectedRole, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    });
    return response;
  }

  if (roleCookie.toUpperCase() !== expectedRole) {
    // Allow cross-panel browsing by refreshing the role cookie to match the visited panel.
    const response = NextResponse.next();
    response.cookies.set('role', expectedRole, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/courier/:path*', '/customer/:path*'],
};
