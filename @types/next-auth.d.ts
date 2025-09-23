// 파일 경로: src/pages/api/auth/[...nextauth].ts (수정된 최종본)

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
     * JWT 토큰이 생성될 때, Google에서 받은 고유 ID(sub)를 토큰에 'id'라는 이름으로 저장합니다.
     * 이 값은 이후 session 콜백으로 전달됩니다.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * 클라이언트(로그인 페이지 등)에서 세션 정보를 조회할 때 호출됩니다.
     * JWT 토큰에 저장해둔 'id'를 최종 session 객체에 포함시켜,
     * 클라이언트에서 session.user.id 형태로 사용할 수 있게 만듭니다.
     */
    async session({ session, token }) {
      if (token.id && session.user) {
        // session.user 객체에 id를 추가합니다.
        // 타입스크립트 에러를 방지하기 위해 타입을 확장하거나, 간단하게 @ts-ignore를 사용할 수 있습니다.
        // @ts-ignore
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // 로그인 페이지 경로 지정
  },
};

export default NextAuth(authOptions);