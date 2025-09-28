// 파일 경로: /pages/api/check-submission.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGhsXgVYxqgw9alpSBO3ugtLxRrcuMZTK8t2U8koAgfL9SwA1EmB5Oo8-nF1ACv3XA/exec';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('\n--- [API START] /api/check-submission ---'); // 1. API 시작 로그

  if (req.method !== 'GET') {
    console.log(`[API LOG] Method not allowed: ${req.method}`);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. 세션 정보 확인
  const session = await getSession({ req });
  if (!session?.user?.id) {
    console.log('[API LOG] Unauthorized: No session found.');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  console.log(`[API LOG] Session found for user ID: ${session.user.id}`);

  try {
    const fetchUrl = `${GOOGLE_SCRIPT_URL}?userId=${session.user.id}`;
    console.log(`[API LOG] Fetching data from Google Apps Script URL: ${fetchUrl}`); // 3. 호출할 URL 로그

    // 4. Google Apps Script에 GET 요청
    const response = await fetch(fetchUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    console.log(`[API LOG] Google Apps Script response status: ${response.status}`); // 5. 응답 상태 코드 로그

    // 6. 응답 내용을 텍스트로 먼저 확인 (가장 중요!)
    const rawText = await response.text();
    console.log('[API LOG] Raw response text from Google:', rawText);

    // 7. 텍스트를 JSON으로 파싱
    const result = JSON.parse(rawText);
    console.log('[API LOG] Parsed JSON result:', result);

    if (result.error) {
      throw new Error(result.error);
    }
    
    // 8. 최종 결과 전송
    console.log(`[API LOG] Sending final response to client: { exists: ${result.exists} }`);
    console.log('--- [API END] /api/check-submission ---');
    res.status(200).json({ exists: result.exists });

  } catch (error: any) {
    console.error('[API CRITICAL ERROR] Failed to check submission:', error.message);
    console.log('--- [API END] /api/check-submission with ERROR ---');
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}