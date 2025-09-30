// 파일 경로: @types/next-auth.d.ts

import { DefaultSession } from 'next-auth';

// Session 타입을 확장하여 필요한 속성들을 추가합니다.
declare module 'next-auth' {
    interface Session {
      user: {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        isNewUser?: boolean;
        isAdmin?: boolean;
        roles?: string[];
      };
    }
}
