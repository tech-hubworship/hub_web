// 파일 경로: @types/next-auth.d.ts

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * 클라이언트에서 사용될 Session 객체의 최종 타입 정의
   */
  interface Session {
    user?: {
      id?: string | null;
      isNewUser?: boolean;
      isAdmin?: boolean;    // ⭐️ 관리자 여부 타입
      roles?: string[];     // ⭐️ 세부 권한 목록 타입
    } & DefaultSession['user']; // 기존의 name, email, image 타입은 NextAuth 기본 타입을 그대로 사용
  }
}