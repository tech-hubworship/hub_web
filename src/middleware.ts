// 파일 경로: src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // favicon.ico 요청 최적화 - 긴 캐시 시간 설정
  if (pathname === '/favicon.ico') {
    const response = NextResponse.next();
    // 1년 캐시 (favicon은 거의 변경되지 않음)
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
    return response;
  }

  // /admin 경로 보호
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 로그인하지 않은 경우
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // 관리자 권한이 없는 경우
    // @ts-ignore - custom token fields
    if (!token.isAdmin) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/favicon.ico',
    '/admin/:path*',
  ],
};

