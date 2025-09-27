// 파일 경로: src/pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from '@src/lib/supabase';

// Session 타입 정의는 @types/next-auth.d.ts 파일에서 관리합니다.

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

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('phone_number, birth_date, status')
          .eq('user_id', token.sub)
          .single();
        
        if (!profile) {
          await supabaseAdmin.from('profiles').insert({ user_id: token.sub, email: token.email, name: token.name });
          session.user.isNewUser = true;
          session.user.isAdmin = false;
          session.user.roles = [];
        } else {
          session.user.isNewUser = !profile.phone_number || !profile.birth_date;
          session.user.isAdmin = profile.status === '관리자';

          if (session.user.isAdmin) {
            const { data: rolesData } = await supabaseAdmin
                .from('admin_roles')
                .select('roles(name)')
                .eq('user_id', token.sub);
            
            // ⭐️ [핵심 수정] rolesData의 타입을 명확하게 지정하여 TypeScript 오류를 해결합니다.
            // Supabase 조회 결과가 `{ roles: { name: string } }` 형태의 객체 배열임을 알려줍니다.
            const typedRolesData = rolesData as { roles: { name: string } }[] | null;

            session.user.roles = typedRolesData 
                ? typedRolesData.map(r => r.roles.name) 
                : [];

          } else {
            session.user.roles = [];
          }
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