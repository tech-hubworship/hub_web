import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }

      // 사용자 ID 처리
      let userId = session.user.id || session.user.email || 'anonymous';
      if (userId.length > 100) {
        userId = userId.substring(0, 100);
      }

      const { post_dt, checkOnly } = req.query;

      // 특정 날짜의 묵상 존재 여부만 확인하는 경우
      if (checkOnly === 'true' && post_dt) {
        const { data: existingComments, error: checkError } = await supabaseAdmin
          .from('advent_comments')
          .select('comment_id')
          .eq('reg_id', userId)
          .eq('post_dt', post_dt)
          .limit(1);

        if (checkError) {
          console.error('묵상 확인 오류:', checkError);
          return res.status(500).json({ error: '묵상 확인에 실패했습니다.' });
        }

        return res.status(200).json({ hasMeditation: existingComments && existingComments.length > 0 });
      }

      // 사용자의 묵상들을 가져오면서 profiles 테이블과 조인하여 name 가져오기
      // Supabase에서 직접 조인은 외래키가 필요하므로, 
      // reg_id를 기준으로 profiles에서 name을 가져옴
      const { data: comments, error: commentsError } = await supabaseAdmin
        .from('advent_comments')
        .select('*')
        .eq('reg_id', userId)
        .order('post_dt', { ascending: false })
        .order('reg_dt', { ascending: false });

      if (commentsError) {
        console.error('사용자 묵상 조회 오류:', commentsError);
        return res.status(500).json({ error: '묵상을 불러오는데 실패했습니다.' });
      }

      if (!comments || comments.length === 0) {
        return res.status(200).json({ comments: [] });
      }

      // profiles 테이블에서 사용자 정보 조회 (공동체, 그룹, 셀, 이름)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)')
        .eq('user_id', userId)
        .single();

      // 이름 마스킹 함수 (예: "홍길동" -> "홍0동", "김철수" -> "김0수")
      const maskName = (name: string): string => {
        if (!name || name.length < 2) return name || '익명';
        if (name.length === 2) {
          return name[0] + '0';
        }
        // 3글자 이상: 첫 글자 + 0 + 마지막 글자
        return name[0] + '0' + name[name.length - 1];
      };

      // 제외할 그룹/셀 ID 목록
      const excludeGroupIds = [7, 99];
      const excludeCellIds = [26, 99];

      // 이름과 소속 분리
      let maskedName = '익명';
      let affiliation = '';
      if (profile) {
        const community = profile.community || '';
        // 제외 대상 그룹/셀은 빈 문자열로 처리
        const groupName = excludeGroupIds.includes(profile.group_id) ? '' : ((profile.hub_groups as any)?.name || '');
        const cellName = excludeCellIds.includes(profile.cell_id) ? '' : ((profile.hub_cells as any)?.name || '');
        maskedName = maskName(profile.name);
        
        const parts = [community, groupName, cellName].filter(Boolean);
        affiliation = parts.join('/');
      }

      // 각 묵상에 user_name, user_affiliation 추가
      const commentsWithNames = comments.map((comment) => ({
        ...comment,
        user_name: maskedName,
        user_affiliation: affiliation,
      }));

      return res.status(200).json({ comments: commentsWithNames });
    } catch (error) {
      console.error('사용자 묵상 조회 오류:', error);
      return res.status(500).json({ error: '묵상을 불러오는데 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

