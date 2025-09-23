// 파일 경로: src/pages/api/auth/[...nextauth].ts (최종 수정본)

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    /**
     * JWT 토큰이 생성될 때, Google 계정의 고유 ID(sub)를 토큰에 'id'라는 이름으로 저장합니다.
     * 이 값은 login/Info 페이지에서 사용자를 식별하는 데 사용됩니다.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * 클라이언트에서 세션 정보를 조회할 때, JWT 토큰에 저장된 'id'를
     * 최종 session.user 객체에 포함시켜 전달합니다.
     */
    async session({ session, token }) {
      if (token.id && session.user) {
        // session.user.id 형태로 클라이언트에서 사용할 수 있게 됩니다.
        // @ts-ignore
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);