import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/pages/api/auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

// 서비스 키를 사용한 Supabase 클라이언트 (RLS 우회)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    // 1. profiles 테이블에서 관리자 상태 확인
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id, name, status')
      .eq('user_id', session.user.id)
      .eq('status', '관리자')
      .single();

    // 2. admin_roles 테이블에서 역할 확인
    const { data: adminRoles, error: adminError } = await supabaseClient
      .from('admin_roles')
      .select(`
        user_id,
        role_id,
        roles!inner (
          id,
          name,
          description
        )
      `)
      .eq('user_id', session.user.id)
      .in('roles.name', session.user.roles || []);

    // 3. 권한 확인 (관리자 상태이거나 역할 권한이 있는 경우)
    const isAdmin = profile && profile.status === '관리자';
    const hasRole = adminRoles && adminRoles.length > 0;
    const admin = isAdmin || hasRole;

    if (!admin) {
      console.log('Access denied - no admin status or roles found');
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    switch (req.method) {
      case 'GET':
        return await getReservations(req, res);
      case 'PUT':
        return await updateReservation(req, res);
      default:
        return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 예약 현황 조회 (관리자용)
async function getReservations(req: NextApiRequest, res: NextApiResponse) {
  const { status, user_id, photo_id } = req.query;

  try {
    let query = supabaseClient
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
      .order('created_at', { ascending: false });

    // 필터 적용
    if (status) {
      query = query.eq('status', status);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (photo_id) {
      query = query.eq('photo_id', photo_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('예약 조회 오류:', error);
      return res.status(500).json({ error: '예약 조회 실패' });
    }

    // 예약 통계 계산
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(r => r.status === '예약중').length || 0,
      completed: data?.filter(r => r.status === '예약완료').length || 0,
      cancelled: data?.filter(r => r.status === '취소됨').length || 0,
    };

    return res.status(200).json({ 
      reservations: data || [],
      stats
    });
  } catch (error) {
    console.error('예약 조회 오류:', error);
    return res.status(500).json({ error: '예약 조회 실패' });
  }
}

// 예약 상태 수정 (관리자용)
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
      .single();

    if (error) {
      console.error('예약 수정 오류:', error);
      return res.status(500).json({ error: '예약 수정 실패' });
    }

    return res.status(200).json({ 
      message: '예약 상태가 수정되었습니다.',
      reservation: data 
    });
  } catch (error) {
    console.error('예약 수정 오류:', error);
    return res.status(500).json({ error: '예약 수정 실패' });
  }
}
