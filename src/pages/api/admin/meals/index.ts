import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@src/lib/supabase';

// 식단표 인터페이스 정의
interface MealPlan {
  id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  menu: string;
  created_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return getMeals(req, res);
    case 'POST':
      return createMeal(req, res);
    default:
      return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }
}

// 모든 식단 조회
async function getMeals(req: NextApiRequest, res: NextApiResponse) {
  try {
    // URL 파라미터에서 날짜 범위 추출
    const { start_date, end_date } = req.query;
    
    // Supabase에서 식단 목록 조회
    let query = supabase
      .from('meals')
      .select('*')
      .order('date', { ascending: true })
      .order('meal_type', { ascending: true });
    
    // 날짜 범위 필터 적용
    if (start_date && typeof start_date === 'string') {
      query = query.gte('date', start_date);
    }
    
    if (end_date && typeof end_date === 'string') {
      query = query.lte('date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('식단 목록 조회 중 오류:', error);
    return res.status(500).json({ 
      message: '식단 목록을 조회하는 중 오류가 발생했습니다',
      error: error.message 
    });
  }
}

// 새 식단 생성
async function createMeal(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { date, meal_type, menu } = req.body;
    
    // 필수 필드 검증
    if (!date || !meal_type || !menu) {
      return res.status(400).json({ message: '날짜, 식사 종류, 메뉴는 필수 입력 사항입니다' });
    }
    
    // 유효한 식사 종류인지 검증
    if (!['breakfast', 'lunch', 'dinner'].includes(meal_type)) {
      return res.status(400).json({ message: '유효하지 않은 식사 종류입니다' });
    }
    
    // Supabase에 새 식단 추가
    const { data, error } = await supabase
      .from('meals')
      .insert([
        { 
          date, 
          meal_type, 
          menu
        }
      ])
      .select();
    
    if (error) {
      // 유니크 제약 조건 위반 체크 (같은 날짜, 같은 식사 유형)
      if (error.code === '23505') {
        return res.status(400).json({ 
          message: '해당 날짜의 동일한 식사 유형이 이미 등록되어 있습니다. 다른 식사 유형을 선택해주세요.' 
        });
      }
      throw error;
    }
    
    return res.status(201).json(data[0]);
  } catch (error: any) {
    console.error('식단 생성 중 오류:', error);
    return res.status(500).json({ 
      message: '새 식단을 생성하는 중 오류가 발생했습니다',
      error: error.message 
    });
  }
} 