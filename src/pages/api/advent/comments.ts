import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getKoreanTimestamp } from '@src/lib/utils/date';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { date, page = '1', limit = '10' } = req.query;

      if (!date || typeof date !== 'string' || date.length !== 8) {
        return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;

      // 전체 개수 조회
      const { count, error: countError } = await supabaseAdmin
        .from('advent_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_dt', date);

      if (countError) {
        console.error('댓글 개수 조회 오류:', countError);
      }

      // 댓글 조회 (페이징)
      const { data, error } = await supabaseAdmin
        .from('advent_comments')
        .select('*')
        .eq('post_dt', date)
        .order('reg_dt', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('댓글 조회 오류:', error);
        return res.status(500).json({ error: '댓글을 불러오는데 실패했습니다.' });
      }

      // 각 댓글의 사용자 정보 조회 (공동체, 그룹, 셀, 이름)
      const userIds = Array.from(new Set((data || []).map(comment => comment.reg_id)));
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)')
        .in('user_id', userIds);

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

      const profileMap = new Map();
      profiles?.forEach(profile => {
        const community = profile.community || '';
        // 제외 대상 그룹/셀은 빈 문자열로 처리
        const groupName = excludeGroupIds.includes(profile.group_id) ? '' : ((profile.hub_groups as any)?.name || '');
        const cellName = excludeCellIds.includes(profile.cell_id) ? '' : ((profile.hub_cells as any)?.name || '');
        const maskedName = maskName(profile.name);
        
        // 소속 정보 (공동체/그룹/다락방)
        const parts = [community, groupName, cellName].filter(Boolean);
        const affiliation = parts.join('/');
        
        profileMap.set(profile.user_id, {
          name: maskedName,
          affiliation: affiliation,
        });
      });

      // 댓글에 user_name, user_affiliation 추가
      const commentsWithNames = (data || []).map((comment) => {
        const userInfo = profileMap.get(comment.reg_id);
        return {
          ...comment,
          user_name: userInfo?.name || '익명',
          user_affiliation: userInfo?.affiliation || '',
        };
      });

      return res.status(200).json({ 
        comments: commentsWithNames,
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        hasMore: (count || 0) > to + 1
      });
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      return res.status(500).json({ error: '댓글을 불러오는데 실패했습니다.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }

      const { post_dt, content } = req.body;

      if (!post_dt || !content) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
      }

      if (typeof post_dt !== 'string' || post_dt.length !== 8) {
        return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
      }

      if (content.length > 1000) {
        return res.status(400).json({ error: '댓글은 1000자 이하여야 합니다.' });
      }

      // 사용자 ID 처리 (이메일의 경우 길이 제한)
      let userId = session.user.id || session.user.email || 'anonymous';
      if (userId.length > 100) {
        userId = userId.substring(0, 100);
      }
      const now = getKoreanTimestamp();

      const { data, error } = await supabaseAdmin
        .from('advent_comments')
        .insert({
          post_dt,
          content: content.trim(),
          reg_id: userId,
          reg_dt: now,
          mod_id: userId,
          mod_dt: now,
        })
        .select()
        .single();

      if (error) {
        console.error('댓글 작성 오류:', error);
        return res.status(500).json({ error: '댓글 작성에 실패했습니다.' });
      }

      return res.status(201).json({ comment: data });
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      return res.status(500).json({ error: '댓글 작성에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

