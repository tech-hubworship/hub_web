// 파일 경로: src/pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from '@src/lib/supabase';

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
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;

        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('*, admin_roles(roles(name))')
          .eq('user_id', token.sub)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile in session:", error);
        }

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