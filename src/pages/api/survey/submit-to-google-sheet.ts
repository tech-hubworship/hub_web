// 파일 경로: /pages/api/submit-to-google-sheet.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

// ⭐️ 중요: 이 URL은 아래 2단계에서 만들 Google Apps Script의 배포 URL입니다.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGhsXgVYxqgw9alpSBO3ugtLxRrcuMZTK8t2U8koAgfL9SwA1EmB5Oo8-nF1ACv3XA/exec';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. 현재 로그인한 사용자 정보 가져오기
  const session = await getSession({ req });
  if (!session?.user?.id || !session.user.email || !session.user.name) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 2. 프론트엔드에서 보낸 설문 데이터와 사용자 정보를 합치기
  const payload = {
    userId: session.user.id, // 구글 ID ('1006...')
    name: session.user.name,
    email: session.user.email,
    ...req.body, // 프론트엔드 폼에서 보낸 데이터 (예: { question1: '답변1' })
  };

  try {
    // 3. Google Apps Script로 최종 데이터 전송
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Google Apps Script는 리디렉션을 따르도록 설정해야 할 수 있습니다.
      redirect: 'follow', 
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.status !== 'success') {
      throw new Error(result.message || 'Google Sheet에 데이터를 쓰는 데 실패했습니다.');
    }
    
    // 성공 응답 반환
    res.status(200).json({ message: '성공적으로 제출되었습니다.' });

  } catch (error: any) {
    console.error('Error submitting to Google Sheet:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}