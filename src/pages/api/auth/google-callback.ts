import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@src/lib/supabase';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
//const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code missing" });
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: "https://hubworship.ing/api/auth/google-callback",
        grant_type: "authorization_code",
      }),
    });
    console.log("Token exchange 요청 redirect_uri:", process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI);
    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("[로그] Google 토큰 교환 실패:", errText);
      return res.status(401).json({ error: "Failed to exchange code for token" });
    }

    

    const { id_token, access_token } = await tokenResponse.json();

    if (!id_token) {
      return res.status(400).json({ error: "ID token missing from Google response" });
    }

    const { data, error: sessionError } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: id_token,
    });

    if (sessionError) {
      console.error("[로그] Supabase 세션 생성 실패:", sessionError);
      return res.status(500).json({ error: "Failed to create Supabase session" });
    }

    if (!data.user || !data.session) {
      return res.status(500).json({ error: "Supabase user or session not found" });
    }
    
    // 클라이언트에게 세션 정보와 사용자 정보를 모두 반환
    return res.status(200).json({ user: data.user, session: data.session });

  } catch (err) {
    console.error("[로그] Google OAuth 처리 중 오류:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}