// 파일 경로: /pages/api/auth/session.ts

import { getServerSession } from "next-auth/next"
import { authOptions } from "./[...nextauth]"
import { supabaseAdmin } from "@src/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user?.id || !session.user?.email || !session.user?.name) {
    return res.status(401).json({ message: "You must be logged in." });
  }

  const userId = session.user.id;
  
  try {
    // 1. DB에서 현재 유저의 프로필을 조회합니다.
    // ⭐️ [수정] 더 이상 존재하지 않는 'phone_number' 대신, 'birth_date'를 조회합니다.
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('birth_date') // 'birth_date'가 입력되었는지를 기준으로 신규 유저 여부를 판단합니다.
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: 'Not Found'는 정상적인 경우일 수 있습니다.
        throw error;
    }

    let isNewUser = false;
    // 2. 프로필이 없다면, 이 사용자는 최초 로그인입니다.
    if (!profile) {
        // DB에 기본 프로필을 생성해줍니다.
        const { error: insertError } = await supabaseAdmin.from('profiles').insert({
            user_id: userId,
            name: session.user.name,
            email: session.user.email
        });
        if (insertError) throw insertError;
        isNewUser = true;
    } else {
        // ⭐️ [수정] 'birth_date'가 있는지 여부로 신규 유저를 판단합니다.
        isNewUser = !profile.birth_date;
    }

    // 3. 최종 세션 정보에 isNewUser를 포함하여 반환합니다.
    res.status(200).json({ ...session, user: { ...session.user, isNewUser } });

  } catch (e: any) {
    console.error("Error in custom session endpoint:", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
}