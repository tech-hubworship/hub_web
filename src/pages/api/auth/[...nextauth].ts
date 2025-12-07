// 파일 경로: src/pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from '@src/lib/supabase';
import { unstable_cache } from 'next/cache';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development',
  useSecureCookies: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  cookies: {
    state: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.state' 
        : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15분
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      // 토큰에 isAdmin 정보 추가 (캐싱 적용)
      if (token.sub) {
        // 캐시된 프로필 조회 (같은 사용자의 짧은 시간 내 요청은 캐시에서 반환)
        const getCachedAdminProfile = unstable_cache(
          async (userId: string) => {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('status, admin_roles(roles(name))')
              .eq('user_id', userId)
              .maybeSingle();
            return profile;
          },
          ['user-admin-profile'],
          {
            tags: ['user-profile'],
            revalidate: 60, // 1분 캐싱
          }
        );

        const profile = await getCachedAdminProfile(token.sub);

        if (profile) {
          const hasAdminRoles = profile.admin_roles && (profile.admin_roles as any[]).length > 0;
          const isAdminByStatus = profile.status === '관리자';
          token.isAdmin = hasAdminRoles || isAdminByStatus;
        } else {
          token.isAdmin = false;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;

        // 캐시된 프로필 조회 (같은 사용자의 짧은 시간 내 요청은 캐시에서 반환)
        const getCachedFullProfile = unstable_cache(
          async (userId: string) => {
            const { data: profile, error } = await supabaseAdmin
              .from('profiles')
              .select('*, admin_roles(roles(name))')
              .eq('user_id', userId)
              .maybeSingle();
            
            if (error) {
              console.error("Error fetching profile in session:", error);
            }

            return profile;
          },
          ['user-full-profile'],
          {
            tags: ['user-profile'],
            revalidate: 60, // 1분 캐싱
          }
        );

        const profile = await getCachedFullProfile(token.sub);

        if (!profile) {
          // --- 최초 로그인 사용자 ---
          await supabaseAdmin.from('profiles').insert({
              user_id: token.sub,
              email: token.email,
              name: token.name,
          });
          session.user.isNewUser = true;
          session.user.isAdmin = false; // 신규 유저는 관리자가 아님
          session.user.roles = [];      // 신규 유저는 역할이 없음
        } else {
          // --- 기존 사용자 ---
          session.user.isNewUser = !profile.birth_date;
          session.user.name = profile.name;
          // ⭐️ [수정된 관리자 확인 로직]
          // 1. admin_roles 또는 status로 관리자 여부 확인
          const hasAdminRoles = profile.admin_roles && (profile.admin_roles as any[]).length > 0;
          const isAdminByStatus = profile.status === '관리자';
          
          // 2. session.user.isAdmin (boolean) 설정
          session.user.isAdmin = hasAdminRoles || isAdminByStatus;
          
          // 3. session.user.roles (역할 이름 배열) 설정
          if (hasAdminRoles) {
            session.user.roles = (profile.admin_roles as any[]).map(
              (roleEntry) => roleEntry.roles?.name
            ).filter(Boolean); // null이나 undefined가 들어가지 않도록 필터링
          } else {
            session.user.roles = [];
          }
        }
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);