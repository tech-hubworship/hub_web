import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { userId, name, email, answers }: { userId: string, name: string, email: string, answers: Record<string,string> } = req.body;

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || '{}');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Responses 시트 전체 조회
    const sheetResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Responses!A2:D',
    });

    const rows: string[][] = sheetResp.data.values || [];

    // userId 기준으로 이미 제출했는지 확인
    const existingIndex = rows.findIndex((row: string[]) => row[0] === userId);
    if (existingIndex !== -1) {
    return res.status(400).json({ message: '이미 설문에 응답하셨습니다.' });
    }

    // 새 행 생성 (answers는 JSON 문자열)
    const newRow = [
      userId,
      name || '',
      email || '',
      JSON.stringify(answers),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Responses!A:D',
      valueInputOption: 'RAW',
      requestBody: { values: [newRow] },
    });

    res.status(200).json({ status: 'success' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: '응답 제출 실패', details: err.message });
  }
}
