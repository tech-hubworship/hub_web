// 파일 경로: src/pages/api/admin/download-survey-csv.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '@src/lib/supabase';

/**
 * ⭐️ [수정] JSON 객체 배열을 CSV 문자열로 변환하는, 타입이 더 안전한 헬퍼 함수
 * @param data 변환할 데이터 배열
 * @returns CSV 형식의 문자열
 */
const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';

    // 1. CSV 헤더를 동적으로 생성
    const allKeys = data.reduce((keys, obj) => {
        if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => keys.add(key));
        }
        return keys;
    }, new Set<string>());
    
    const headers: string[] = Array.from(allKeys); // 헤더 타입을 string[]으로 명시
    const csvRows = [headers.join(',')];

    // 2. 각 행을 CSV 형식으로 변환
    for (const row of data) {
        const values = headers.map((header: string) => { // header 타입을 string으로 명시
            // row가 어떤 타입이든 키로 접근할 수 있도록 any로 간주
            const value = (row as any)[header];

            if (value === null || value === undefined) {
                return '';
            }
            const stringValue = String(value);
            // 쉼표나 줄바꿈이 포함된 경우 큰따옴표로 감싸기
            if (/[",\n]/.test(stringValue)) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  // @ts-ignore
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: Access is denied.' });
  }

  const { surveyId, page = '1' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limit = 100;
  const offset = (pageNum - 1) * limit;

  if (!surveyId || isNaN(pageNum)) {
    return res.status(400).json({ message: 'A valid survey ID and page number are required.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('survey_responses')
      .select(`
        created_at,
        response_data,
        profiles ( name, email )
      `)
      .eq('survey_id', surveyId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    const formattedData = data.map(item => ({
      // @ts-ignore
      name: item.profiles.name,
      // @ts-ignore
      email: item.profiles.email,
      submitted_at: item.created_at,
      ...item.response_data,
    }));

    const csvData = convertToCSV(formattedData);
    const BOM = '\uFEFF'; // Excel에서 한글 깨짐 방지를 위한 BOM
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="survey-${surveyId}-page-${pageNum}-responses.csv"`);
    
    res.status(200).send(BOM + csvData);

  } catch (error: any) {
    console.error('Error exporting survey responses to CSV:', error);
    res.status(500).json({ message: 'Failed to export survey responses', details: error.message });
  }
}