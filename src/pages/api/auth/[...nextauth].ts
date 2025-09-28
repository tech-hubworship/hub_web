// 파일 경로: src/pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from '@src/lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: 'jwt',
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

        // ⭐️ [핵심 수정] 더 이상 존재하지 않는 'phone_number' 대신,
        // 'isNewUser' 여부를 판별할 수 있는 'birth_date'와 'cell_name'을 조회합니다.
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('birth_date, cell_name') // 프로필 완성 여부를 확인할 수 있는 컬럼 조회
          .eq('user_id', token.sub)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile in session:", error);
        }

        // [핵심] 조회 결과, 프로필이 없다면 최초 로그인으로 간주하고 기본 프로필 생성
        if (!profile) {
          await supabaseAdmin.from('profiles').insert({
              user_id: token.sub,
              email: token.email,
              name: token.name,
          });
          session.user.isNewUser = true;
        } else {
          // ⭐️ [핵심 수정] 프로필이 있다면, 'birth_date'가 입력되었는지를 기준으로 신규 유저 여부를 판단합니다.
          // birth_date는 모든 유저의 필수값이기 때문입니다.
          session.user.isNewUser = !profile.birth_date;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);