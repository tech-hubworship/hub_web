// 파일 경로: src/pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

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
  // ⭐️ [핵심] 콜백을 극도로 단순화하여 안정성을 확보합니다.
  callbacks: {
    // 1. jwt: 토큰에 로그인에 필요한 최소한의 정보(ID, 이름, 이메일)만 담습니다.
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id; // 구글 ID
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    // 2. session: 브라우저가 사용할 세션 객체에 토큰 정보를 그대로 전달합니다.
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // isNewUser 같은 DB 정보는 여기서 확인하지 않습니다!
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);