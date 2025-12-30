// 파일 경로: src/pages/api/bible-card/admin/upload-excel.ts
// 관리자: 엑셀 파일 파싱 및 미리보기 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';
import * as XLSX from 'xlsx';

interface ExcelRow {
  id: number;
  drive_link: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    const { fileData, fileName } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: '엑셀 파일 데이터가 필요합니다.' });
    }

    // Base64 데이터를 버퍼로 변환
    const base64Data = fileData.split(',')[1] || fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    // 엑셀 파일 파싱
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    // 데이터 검증 및 변환
    const excelData: ExcelRow[] = [];
    const errors: string[] = [];

    data.forEach((row: any, index: number) => {
      const rowNum = index + 2; // 헤더 제외, 엑셀은 1부터 시작

      // ID 컬럼 찾기 (대소문자 구분 없이)
      const idKey = Object.keys(row).find(
        key => key.toLowerCase().includes('id') || 
               key.toLowerCase().includes('신청') ||
               key.toLowerCase().includes('번호')
      );
      const linkKey = Object.keys(row).find(
        key => key.toLowerCase().includes('link') || 
               key.toLowerCase().includes('링크') ||
               key.toLowerCase().includes('구글') ||
               key.toLowerCase().includes('드라이브')
      );

      if (!idKey) {
        errors.push(`행 ${rowNum}: ID 컬럼을 찾을 수 없습니다.`);
        return;
      }

      if (!linkKey) {
        errors.push(`행 ${rowNum}: 링크 컬럼을 찾을 수 없습니다.`);
        return;
      }

      const id = parseInt(row[idKey], 10);
      const drive_link = String(row[linkKey] || '').trim();

      if (isNaN(id) || id <= 0) {
        errors.push(`행 ${rowNum}: 올바른 ID가 아닙니다 (${row[idKey]}).`);
        return;
      }

      if (!drive_link) {
        errors.push(`행 ${rowNum}: 링크가 비어있습니다.`);
        return;
      }

      excelData.push({ id, drive_link });
    });

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: '엑셀 파일 파싱 오류',
        errors 
      });
    }

    // DB에서 해당 ID들이 존재하는지 확인
    const ids = excelData.map(row => row.id);
    const { data: existingApps, error: fetchError } = await supabaseAdmin
      .from('bible_card_applications')
      .select('id, name, drive_link_1')
      .in('id', ids);

    if (fetchError) {
      console.error('Error fetching applications:', fetchError);
      return res.status(500).json({ error: '신청 정보 조회 실패' });
    }

    const existingIds = new Set(existingApps?.map(app => app.id) || []);
    const notFoundIds = ids.filter(id => !existingIds.has(id));

    if (notFoundIds.length > 0) {
      return res.status(400).json({
        error: '존재하지 않는 신청 ID가 있습니다.',
        notFoundIds
      });
    }

    // 미리보기 데이터 생성
    const preview = excelData.map(row => {
      const app = existingApps?.find(a => a.id === row.id);
      return {
        id: row.id,
        name: app?.name || '-',
        current_link: app?.drive_link_1 || null,
        new_link: row.drive_link,
      };
    });

    return res.status(200).json({
      success: true,
      preview,
      totalCount: preview.length,
    });
  } catch (error: any) {
    console.error('Error in upload-excel API:', error);
    return res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
}


