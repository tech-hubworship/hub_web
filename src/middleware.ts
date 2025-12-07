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

  // NextAuth 세션 API Edge request 최적화
  // /api/auth/session은 NextAuth가 자동으로 생성하는 엔드포인트
  if (pathname === '/api/auth/session') {
    const response = NextResponse.next();
    // 세션 정보는 사용자별로 다르므로 짧은 시간만 캐싱 (보안 고려)
    // private: 공유 캐시에 저장하지 않음 (사용자별 데이터이므로)
    // max-age=0: 브라우저는 항상 재검증
    // s-maxage=60: Edge/CDN에서 1분 캐싱 (같은 사용자의 반복 요청 감소)
    // stale-while-revalidate=120: 만료 후 2분 동안 stale 데이터 제공하며 백그라운드 재검증
    response.headers.set(
      'Cache-Control',
      'private, max-age=0, s-maxage=60, stale-while-revalidate=120, must-revalidate'
    );
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
    '/api/auth/session',
    '/admin/:path*',
  ],
};
