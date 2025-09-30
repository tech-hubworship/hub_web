import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') throw new Error('POST 요청만 가능합니다.');

    const { userId, answers } = req.body;
    if (!userId || !answers) throw new Error('userId와 answers가 필요합니다.');

    // 1️⃣ Supabase에서 실제 이름, 이메일 가져오기
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('user_id', userId)
      .single();

    if (userError) throw new Error(userError.message);
    if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다.');

    const { name, email } = userData;

    // 2️⃣ Google Sheets responses 시트 업데이트
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID 환경변수가 없습니다.');

    // Responses 시트 전체 가져오기
    const sheetResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'responses!A2:B', // userId | answers(JSON)
    });

    const rows = sheetResp.data.values || [];

    // 3️⃣ 이미 제출했는지 체크
    const existingIndex = rows.findIndex((row: any) => row[0] === userId);
    if (existingIndex !== -1) {
      return res.status(400).json({ message: '이미 설문에 응답하셨습니다.' });
    }

    // 4️⃣ 새 행 추가
    const newRow = [userId, name, email, JSON.stringify(answers)];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'responses!A:D',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });

    res.status(200).json({ message: '응답이 저장되었습니다.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
