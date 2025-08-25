import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  
  // 로그인 페이지 경로
  const loginPath = '/admin/login';
  
  // 로그인 페이지인 경우 미들웨어 처리 생략
  if (pathname === loginPath) {
    return NextResponse.next();
  }
  
  // 세션 확인
  const session = request.cookies.get('admin_session')?.value;
  if (!session) {
    url.pathname = loginPath;
    return NextResponse.redirect(url);
  }

  try {
    // 세션 검증
    const sessionData = JSON.parse(session);
    const currentTime = Date.now();
    
    if (!sessionData || !sessionData.expiry || sessionData.expiry < currentTime) {
      // 세션이 만료되었거나 유효하지 않은 경우
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }

    // 세션이 유효한 경우 요청을 계속 진행
    return NextResponse.next();
  } catch (error) {
    console.error('Session validation error:', error);
    url.pathname = loginPath;
    return NextResponse.redirect(url);
  }
}

// /admin 경로와 그 하위 경로에 대해 미들웨어 적용
export const config = {
  matcher: ['/admin/:path*'],
}; 