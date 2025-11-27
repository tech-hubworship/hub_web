/**
 * 다운로드 카운트 차감 API
 * GET: 현재 남은 다운로드 수 조회
 * POST: 다운로드 카운트 차감
 * 
 * Supabase 데이터베이스를 사용합니다.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, DownloadsTable } from '@src/lib/supabase';
import { getKoreanTimestamp } from '@src/lib/utils/date';

// 다운로드 정보 타입 정의
interface DownloadInfo {
  id: number;
  key: string;
  remaining_count: number;
  created_at: string;
  updated_at: string;
}

// GET: 현재 남은 다운로드 수 조회
export async function getRemainingDownloads(): Promise<number> {
  try {
    console.log('데이터베이스에서 다운로드 수 조회 시작...');
    
    // 데이터베이스에서 조회
    const { data, error } = await supabaseAdmin
      .from('downloads')
      .select('remaining_count')
      .eq('key', 'wallpaper_downloads')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('데이터베이스 조회 에러:', error);
      
      // 데이터가 없으면 초기화
      if (error.code === 'PGRST116') {
        console.log('데이터가 없어서 초기화합니다...');
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('downloads')
          .insert({
            key: 'wallpaper_downloads',
            remaining_count: 1000
          })
          .select('remaining_count')
          .single();

        if (insertError) {
          console.error('초기화 에러:', insertError);
          return 1000;
        }

        console.log('초기화 완료:', insertData.remaining_count);
        return insertData.remaining_count;
      }
      
      return 1000; // 에러 시 기본값 반환
    }

    console.log('데이터베이스 조회 성공:', data.remaining_count);
    return data.remaining_count;
  } catch (error) {
    console.error('getRemainingDownloads 에러:', error);
    return 1000; // 에러 시 기본값 반환
  }
}

// POST: 다운로드 카운트 차감
export async function decrementDownloadCount(): Promise<{ success: boolean; remaining_count: number; can_download: boolean }> {
  try {
    console.log('일반 SQL 쿼리로 다운로드 카운트 차감 시작...');
    
    // 먼저 현재 카운트를 GET 함수로 조회
    const currentCount = await getRemainingDownloads();
    console.log('현재 카운트:', currentCount);

    if (currentCount <= 0) {
      console.log('다운로드 한도 초과');
      return {
        success: false,
        remaining_count: currentCount,
        can_download: false
      };
    }

    // 카운트 차감
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('downloads')
      .update({
        remaining_count: currentCount - 1,
        updated_at: getKoreanTimestamp()
      })
      .eq('key', 'wallpaper_downloads')
      .select('remaining_count')
      .single();

    if (updateError) {
      console.error('카운트 차감 에러:', updateError);
      return {
        success: false,
        remaining_count: currentCount,
        can_download: false
      };
    }

    console.log('데이터베이스에서 카운트 차감 성공:', updateData.remaining_count);
    return {
      success: true,
      remaining_count: updateData.remaining_count,
      can_download: true
    };
  } catch (error) {
    console.error('decrementDownloadCount 에러:', error);
    return {
      success: false,
      remaining_count: 0,
      can_download: false
    };
  }
}

// API 핸들러
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[${req.method}] /api/downloads/decrement 요청 받음`);
  
  try {
    switch (req.method) {
      case 'GET':
        console.log('GET 요청: 남은 다운로드 수 조회');
        const remainingCount = await getRemainingDownloads();
        console.log(`현재 남은 다운로드 수: ${remainingCount}`);
        
        res.status(200).json({
          success: true,
          data: {
            remaining_count: remainingCount
          }
        });
        break;
        
      case 'POST':
        console.log('POST 요청: 다운로드 카운트 차감');
        const result = await decrementDownloadCount();
        console.log('차감 결과:', result);
        
        if (!result.success || !result.can_download) {
          console.log('다운로드 한도 초과');
          return res.status(403).json({
            success: false,
            message: '다운로드 한도가 초과되었습니다.',
            remaining_count: result.remaining_count
          });
        }
        
        console.log(`다운로드 카운트 차감 성공. 남은 수: ${result.remaining_count}`);
        res.status(200).json({
          success: true,
          data: {
            remaining_count: result.remaining_count
          },
          message: '다운로드 카운트가 차감되었습니다.'
        });
        break;
        
      default:
        console.log(`허용되지 않는 메서드: ${req.method}`);
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Download decrement API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
}
