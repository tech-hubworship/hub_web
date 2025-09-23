// 파일 경로: /next-auth.d.ts

import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Session: 타입 확장
   */
  interface Session {
    user?: {
      id?: string | null; // 추가: 사용자 ID
    } & DefaultSession['user']; // 유지: 기존 name, email, image 속성
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT: 타입 확장
   */
  interface JWT {
    id?: string; // 추가: 토큰 ID
  }
}