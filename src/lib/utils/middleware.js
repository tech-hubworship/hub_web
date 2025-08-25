import { NextResponse } from 'next/server';

export function middleware(req) {
  const isLoggedIn = req.cookies.get('user'); // 로그인 상태 확인

  if (!isLoggedIn && req.nextUrl.pathname === '/myinfo') {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/myinfo'], // myinfo 페이지에 대해서만 실행
};
