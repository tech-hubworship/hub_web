import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 서비스 키를 사용한 Supabase 클라이언트 (RLS 우회)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { photo_id, user_id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        return await getReservations(req, res);
      case 'POST':
        return await createReservation(req, res);
      case 'PUT':
        return await updateReservation(req, res);
      case 'DELETE':
        return await cancelReservation(req, res);
      default:
        return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 예약 조회 (사진별 또는 사용자별)
async function getReservations(req: NextApiRequest, res: NextApiResponse) {
  const { photo_id, user_id } = req.query;

  try {
    let query;
    
    if (photo_id) {
      // 특정 사진의 예약 현황 조회
      query = supabaseClient
        .from('photo_reservations')
        .select(`
          id,
          photo_id,
          user_id,
          user_name,
          user_email,
          status,
          reservation_date,
          message,
          created_at,
          updated_at
        `)
        .eq('photo_id', photo_id)
        .eq('status', '예약중');
    } else if (user_id) {
      // 사용자의 예약 현황 조회
      query = supabaseClient
        .from('photo_reservations')
        .select(`
          id,
          photo_id,
          user_id,
          user_name,
          user_email,
          status,
          reservation_date,
          message,
          created_at,
          updated_at,
          photos!inner (
            id,
            title,
            image_url,
            photo_folders!inner (
              id,
              name
            )
          )
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
    } else {
      return res.status(400).json({ error: 'photo_id 또는 user_id가 필요합니다.' });
    }

    const { data, error } = await query;

    if (error) {
      console.error('예약 조회 오류:', error);
      return res.status(500).json({ error: '예약 조회 실패' });
    }

    return res.status(200).json({ reservations: data || [] });
  } catch (error) {
    console.error('예약 조회 오류:', error);
    return res.status(500).json({ error: '예약 조회 실패' });
  }
}

// 예약 생성
async function createReservation(req: NextApiRequest, res: NextApiResponse) {
  const { photo_id, user_id, user_name, user_email, message } = req.body;

  if (!photo_id || !user_id) {
    return res.status(400).json({ error: 'photo_id와 user_id는 필수입니다.' });
  }

  try {
    // 이미 '예약중' 상태로 예약되어 있는지 확인 (취소된 예약은 재예약 가능)
    const { data: existingUserReservation } = await supabaseClient
      .from('photo_reservations')
      .select('id, status')
      .eq('photo_id', photo_id)
      .eq('user_id', user_id)
      .eq('status', '예약중')
      .single();

    if (existingUserReservation) {
      return res.status(400).json({ 
        error: '이미 예약이 완료되어있습니다.',
        reservation: existingUserReservation 
      });
    }

    // 해당 사진이 이미 다른 사용자에게 예약되어 있는지 확인
    const { data: existingPhotoReservation } = await supabaseClient
      .from('photo_reservations')
      .select('id, status, user_id, user_name')
      .eq('photo_id', photo_id)
      .in('status', ['예약중', '예약완료', '수령완료'])
      .single();

    if (existingPhotoReservation) {
      return res.status(400).json({ 
        error: `해당 사진은 이미 ${existingPhotoReservation.user_name || '다른 사용자'}에게 예약되어 있습니다.`,
        reservation: existingPhotoReservation 
      });
    }

    // 사진 존재 여부 확인
    const { data: photo } = await supabaseClient
      .from('photos')
      .select('id, title')
      .eq('id', photo_id)
      .eq('is_active', true)
      .single();

    if (!photo) {
      return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
    }

    // 예약 생성
    const { data, error } = await supabaseClient
      .from('photo_reservations')
      .insert({
        photo_id,
        user_id,
        user_name: user_name || null,
        user_email: user_email || null,
        message: message || null,
        status: '예약중'
      })
      .select()
      .single();

    if (error) {
      console.error('예약 생성 오류:', error);
      return res.status(500).json({ error: '예약 생성 실패' });
    }

    return res.status(201).json({ 
      message: '예약완료',
      reservation: data 
    });
  } catch (error) {
    console.error('예약 생성 오류:', error);
    return res.status(500).json({ error: '예약 생성 실패' });
  }
}

// 예약 수정 (상태 변경 등)
async function updateReservation(req: NextApiRequest, res: NextApiResponse) {
  const { id, status, message } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'id와 status는 필수입니다.' });
  }

  try {
    const { data, error } = await supabaseClient
      .from('photo_reservations')
      .update({
        status,
        message: message || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('예약 수정 오류:', error);
      return res.status(500).json({ error: '예약 수정 실패' });
    }

    return res.status(200).json({ reservation: data });
  } catch (error) {
    console.error('예약 수정 오류:', error);
    return res.status(500).json({ error: '예약 수정 실패' });
  }
}

// 예약 취소
async function cancelReservation(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: '예약 ID가 필요합니다.' });
  }

  try {
    const { data, error } = await supabaseClient
      .from('photo_reservations')
      .update({
        status: '취소됨'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('예약 취소 오류:', error);
      return res.status(500).json({ error: '예약 취소 실패' });
    }

    return res.status(200).json({ 
      message: '예약이 취소되었습니다.',
      reservation: data 
    });
  } catch (error) {
    console.error('예약 취소 오류:', error);
    return res.status(500).json({ error: '예약 취소 실패' });
  }
}
