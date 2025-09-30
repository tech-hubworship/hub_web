// Google Sheets에서 questions 시트 가져오기
import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface Question {
  title: string;
  type: 'text' | 'radio' | 'checkbox';
  options?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID 환경변수가 없습니다.');

    const sheetResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'questions!A2:C', // title | type | options
    });

    const rows = sheetResp.data.values || [];

    const questions: Question[] = rows.map((row: string[]) => {
      const [title, type, options] = row;
      return {
        title,
        type: type as 'text' | 'radio' | 'checkbox',
        options: options ? options.split(',') : undefined,
      };
    });

    res.status(200).json({ questions });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
