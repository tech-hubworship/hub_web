import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// 환경 변수에서 설정 가져오기
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "웹데이터이관용셀";

// Google API 인증 정보
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : "";
const PROJECT_ID = process.env.PROJECT_ID || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    // 환경 변수 확인
    if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !PROJECT_ID) {
      return res.status(500).json({ 
        message: '환경 변수가 올바르게 설정되지 않았습니다.',
        missingVars: {
          spreadsheetId: !SPREADSHEET_ID,
          serviceAccountEmail: !SERVICE_ACCOUNT_EMAIL,
          privateKey: !PRIVATE_KEY,
          projectId: !PROJECT_ID
        }
      });
    }

    // Google Sheets API 접근을 위한 인증
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      projectId: PROJECT_ID
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 스프레드시트 데이터 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Z1000`, // 필요한 범위 조정
    });
    
    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '스프레드시트에서 데이터를 찾을 수 없습니다.' });
    }
    
    // 헤더(첫 번째 행)는 컬럼명으로 사용
    const headers = rows[0] as string[];
    const users = [];
    
    // phone_number 필드의 인덱스 찾기
    const phoneNumberIndex = headers.indexOf('phone_number');
    
    if (phoneNumberIndex === -1) {
      return res.status(400).json({ message: 'phone_number 필드를 찾을 수 없습니다.' });
    }
    
    // 각 행을 객체로 변환 (phone_number가 비어있지 않은 경우만)
    for (let i = 1; i < rows.length; i++) {
      const phoneNumber = rows[i][phoneNumberIndex];
      
      if (phoneNumber && phoneNumber.toString().trim() !== '') {
        const user: { [key: string]: any } = {};
        let hasError = false;
        
        for (let j = 0; j < headers.length; j++) {
          // #VALUE! 오류 확인
          if (rows[i][j] && rows[i][j].toString().includes('#VALUE!')) {
            hasError = true;
            break;
          }
          
          // 헤더 이름과 값 매핑
          const headerName = headers[j];
          
          // boolean 타입 필드인 경우 적절히 변환
          if (typeof rows[i][j] === 'string' && (rows[i][j] === 'true' || rows[i][j] === 'false')) {
            user[headerName] = rows[i][j] === 'true';
          } else if (!rows[i][j] || rows[i][j] === '') {
            // 빈 문자열은 null로 처리
            user[headerName] = null;
          } else {
            user[headerName] = rows[i][j];
          }
        }
        
        if (!hasError) {
          users.push(user);
        }
      }
    }
    
    // 결과 반환
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('스프레드시트 데이터 로드 중 오류 발생:', error);
    return res.status(500).json({ 
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
} 