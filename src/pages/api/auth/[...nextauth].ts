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
    // ⭐️ jwt 콜백을 가장 단순한 형태로 되돌립니다.
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    
    // ⭐️ session 콜백은 DB 조회 로직만 유지합니다.
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;

        const { data: profile } = await supabaseAdmin.from('profiles').select('birth_date, status').eq('user_id', token.sub).single();
        
        if (!profile) {
            await supabaseAdmin.from('profiles').insert({ user_id: token.sub, email: token.email, name: token.name });
            session.user.isNewUser = true;
            session.user.isAdmin = false;
            session.user.roles = [];
        } else {
            session.user.isNewUser = !profile.birth_date;
            session.user.isAdmin = profile.status === '관리자';
            if (session.user.isAdmin) {
                const { data: rolesData } = await supabaseAdmin.from('admin_roles').select('roles(name)').eq('user_id', token.sub);
                const typedRolesData = rolesData as { roles: { name: string } }[] | null;
                session.user.roles = typedRolesData ? typedRolesData.map(r => r.roles.name) : [];
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