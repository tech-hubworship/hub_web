import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (!session) return null;
  // next-auth.d.ts 확장에 의해 session.user.isAdmin이 존재한다고 가정
  // (기존 authOptions 콜백에서 세팅)
  if (!(session.user as any)?.isAdmin) return null;
  return session;
}

