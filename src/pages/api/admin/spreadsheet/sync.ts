import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@src/lib/supabase';

// 사용자 인터페이스 정의
interface UserData {
  [key: string]: any;
  phone_number: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    // 클라이언트에서 전송된 필터링된 데이터 (추가 및 변경 항목만)
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: '동기화할 데이터가 없습니다.' });
    }
    
    console.log(`클라이언트에서 전송된 데이터: ${data.length}개 항목`);
    
    // 데이터 유효성 검사 - phone_number 필드 확인
    const invalidItems = data.filter(item => !item.phone_number || typeof item.phone_number !== 'string');
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        message: '유효하지 않은 데이터가 포함되어 있습니다. phone_number 필드가 필요합니다.',
        invalidCount: invalidItems.length
      });
    }
    
    // 동기화 결과 저장
    let successCount = 0;
    let failCount = 0;
    
    // 데이터를 더 작은 배치로 나누어 처리하여 타임아웃 방지
    const batchSize = 20; // 한 번에 처리할 최대 항목 수
    const batches = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    
    console.log(`총 ${batches.length}개의 배치로 처리합니다.`);
    
    // 각 배치 처리
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`배치 ${i + 1}/${batches.length} 처리 중... (${batch.length}개 항목)`);
      
      // 배치 내 항목 처리
      for (const user of batch) {
        try {
          // phone_number가 비어있는 경우 건너뛰기
          if (!user.phone_number || user.phone_number.trim() === '') {
            console.warn('phone_number가 없는 항목 무시');
            continue;
          }
          
          // Supabase에 사용자 추가 또는 업데이트
          const { error } = await supabase
            .from('users')
            .upsert([user], {
              onConflict: 'phone_number', // phone_number를 기준으로 충돌 처리
              ignoreDuplicates: false // 중복 무시하지 않고 업데이트
            });
          
          if (error) {
            console.error('사용자 업데이트 오류:', error);
            failCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('사용자 처리 중 예외 발생:', error);
          failCount++;
        }
      }
    }
    
    // 결과 반환
    return res.status(200).json({
      totalProcessed: data.length,
      successCount,
      failCount,
      lastSyncTime: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('동기화 중 오류 발생:', error);
    return res.status(500).json({ 
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}

// 테스트용 모의 데이터 생성 함수
function simulateSpreadsheetData() {
  // 모의 사용자 데이터 (테스트 및 데모용)
  const users = Array.from({ length: 15 }, (_, i) => ({
    phone_number: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
    name: `테스트사용자${i + 1}`,
    password: `password${i + 1}`,
    group_name: ['A조', 'B조', 'C조'][Math.floor(Math.random() * 3)],
    departure_time: ['09:00', '10:00', '11:00'][Math.floor(Math.random() * 3)],
    return_time: ['17:00', '18:00', '19:00'][Math.floor(Math.random() * 3)],
    is_admin: i === 0 // 첫 번째 사용자는 관리자로 설정
  }));
  
  return { users };
} 