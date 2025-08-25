import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', // ANON_KEY 사용
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }

  try {
    const { faq1, faq2 } = req.body;

    if (!faq1 || !faq2 || !faq1.id || !faq2.id || faq1.display_order === undefined || faq2.display_order === undefined) {
      return res.status(400).json({ message: '올바른 FAQ 정보가 필요합니다' });
    }

    console.log('순서 교환 시도:', { faq1, faq2 });
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('ANON_KEY 유무:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 두 FAQ의 display_order 값을 서로 교환
    const [updateResult1, updateResult2] = await Promise.all([
      supabaseClient
        .from('faqs')
        .update({ display_order: faq1.display_order })
        .eq('id', faq1.id),
      supabaseClient
        .from('faqs')
        .update({ display_order: faq2.display_order })
        .eq('id', faq2.id)
    ]);

    if (updateResult1.error) {
      console.error('첫 번째 FAQ 업데이트 오류:', updateResult1.error);
      return res.status(500).json({
        message: '첫 번째 FAQ 순서 변경 실패',
        error: updateResult1.error.message
      });
    }

    if (updateResult2.error) {
      console.error('두 번째 FAQ 업데이트 오류:', updateResult2.error);
      return res.status(500).json({
        message: '두 번째 FAQ 순서 변경 실패',
        error: updateResult2.error.message
      });
    }

    return res.status(200).json({ 
      message: 'FAQ 순서가 성공적으로 변경되었습니다',
      data: {
        faq1: { id: faq1.id, new_order: faq1.display_order },
        faq2: { id: faq2.id, new_order: faq2.display_order }
      }
    });
  } catch (error: any) {
    console.error('FAQ 순서 변경 오류:', error);
    return res.status(500).json({
      message: '서버 오류가 발생했습니다',
      error: error.message
    });
  }
} 