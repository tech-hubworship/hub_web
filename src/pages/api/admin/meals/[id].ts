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
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: '유효하지 않은 식단 ID입니다' });
  }
  
  const mealId = parseInt(id);
  
  if (isNaN(mealId)) {
    return res.status(400).json({ message: '식단 ID는 숫자여야 합니다' });
  }
  
  switch (req.method) {
    case 'GET':
      return getMealById(req, res, mealId);
    case 'PUT':
      return updateMeal(req, res, mealId);
    case 'DELETE':
      return deleteMeal(req, res, mealId);
    default:
      return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }
}

// 특정 식단 조회
async function getMealById(req: NextApiRequest, res: NextApiResponse, id: number) {
  try {
    // Supabase에서 식단 조회
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: '해당 식단을 찾을 수 없습니다' });
      }
      throw error;
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('식단 조회 중 오류:', error);
    return res.status(500).json({ 
      message: '식단을 조회하는 중 오류가 발생했습니다',
      error: error.message 
    });
  }
}

// 식단 업데이트
async function updateMeal(req: NextApiRequest, res: NextApiResponse, id: number) {
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
    
    // Supabase에서 식단 업데이트
    const { data, error } = await supabase
      .from('meals')
      .update({ 
        date, 
        meal_type, 
        menu 
      })
      .eq('id', id)
      .select();
    
    if (error) {
      // 유니크 제약 조건 위반 체크 (같은 날짜, 같은 식사 유형)
      if (error.code === '23505') {
        return res.status(400).json({ 
          message: '해당 날짜의 동일한 식사 유형이 이미 등록되어 있습니다. 수정해주세요.' 
        });
      }
      throw error;
    }
    
    if (data.length === 0) {
      return res.status(404).json({ message: '해당 식단을 찾을 수 없습니다' });
    }
    
    return res.status(200).json(data[0]);
  } catch (error: any) {
    console.error('식단 업데이트 중 오류:', error);
    return res.status(500).json({ 
      message: '식단을 업데이트하는 중 오류가 발생했습니다',
      error: error.message 
    });
  }
}

// 식단 삭제
async function deleteMeal(req: NextApiRequest, res: NextApiResponse, id: number) {
  try {
    // Supabase에서 식단 삭제
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json({ message: '식단이 성공적으로 삭제되었습니다' });
  } catch (error: any) {
    console.error('식단 삭제 중 오류:', error);
    return res.status(500).json({ 
      message: '식단을 삭제하는 중 오류가 발생했습니다',
      error: error.message 
    });
  }
} 