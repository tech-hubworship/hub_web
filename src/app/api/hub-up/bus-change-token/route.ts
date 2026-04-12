import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import jwt from 'jsonwebtoken';

const SECRET = process.env.NEXTAUTH_SECRET!;
const BUS_APP_URL = "https://hubup-quest.vercel.app/"


/**
 * GET /api/hub-up/bus-change-token
 * 버스 변경 앱으로 redirect할 단기 토큰 발급 (15분 유효)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const token = jwt.sign(
    { sub: session.user.id, purpose: 'hub_up_bus_change' },
    SECRET,
    { expiresIn: '15m' }
  );

  const redirectUrl = `${BUS_APP_URL}?token=${token}`;
  return NextResponse.redirect(redirectUrl);
}
