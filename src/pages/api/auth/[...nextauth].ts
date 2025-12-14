// 파일 경로: src/pages/api/auth/[...nextauth].ts
// Pages Router용 NextAuth 핸들러
// authOptions는 @src/lib/auth에서 공유하여 사용

import NextAuth from 'next-auth';
import { authOptions } from '@src/lib/auth';

export { authOptions };
export default NextAuth(authOptions);