import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { sessionId, drawnQuestions } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: '세션 ID가 필요합니다.' });
    }

    // 사용 가능한 질문 가져오기 (아직 뽑지 않은 질문만)
    let query = supabaseAdmin
      .from('ice_breaking_questions')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    // 뽑힌 질문 제외
    if (drawnQuestions && drawnQuestions.length > 0) {
      query = query.not('id', 'in', `(${drawnQuestions.join(',')})`);
    }

    const { data: availableQuestions, error: questionsError } = await query;

    if (questionsError) {
      console.error('질문 조회 오류:', questionsError);
      return res.status(500).json({ error: '질문을 가져오는데 실패했습니다.' });
    }

    if (!availableQuestions || availableQuestions.length === 0) {
      return res.status(404).json({ 
        error: '더 이상 뽑을 질문이 없습니다!',
        message: '모든 질문을 뽑으셨습니다. 세션을 초기화하면 다시 뽑을 수 있습니다.'
      });
    }

    // 랜덤으로 하나 선택
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    // 세션 정보 업데이트 (또는 생성)
    const { error: sessionError } = await supabaseAdmin
      .from('ice_breaking_sessions')
      .upsert({
        session_id: sessionId,
        question_ids: [...(drawnQuestions || []), selectedQuestion.id],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      });

    if (sessionError) {
      console.error('세션 업데이트 오류:', sessionError);
      // 세션 업데이트 실패해도 질문은 반환
    }

    return res.status(200).json({
      question: selectedQuestion,
      totalQuestions: availableQuestions.length,
      drawnCount: drawnQuestions ? drawnQuestions.length + 1 : 1
    });
  } catch (error) {
    console.error('질문 뽑기 오류:', error);
    return res.status(500).json({ error: '질문 뽑기에 실패했습니다.' });
  }
}

