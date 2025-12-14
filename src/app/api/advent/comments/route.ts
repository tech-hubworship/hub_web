import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';
import { getKoreanTimestamp } from '@src/lib/utils/date';
import { unstable_cache, revalidateTag } from 'next/cache';

/**
 * GET API: 묵상(댓글) 조회
 * 
 * ✅ App Router 캐시 전략 (unstable_cache)
 * - 태그 기반 캐싱: 'advent-comments' 태그로 캐시 관리
 * - revalidate: 3600초 (1시간) - 캐시 유효 기간
 * - 묵상 저장(POST) 시 revalidateTag('advent-comments')로 즉시 무효화
 */

// 캐시된 댓글 조회 함수
const getCachedComments = unstable_cache(
  async (postDate: string, pageNum: number, limitNum: number) => {
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // 전체 개수 조회
    const { count, error: countError } = await supabaseAdmin
      .from('advent_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_dt', postDate);

    if (countError) {
      console.error('댓글 개수 조회 오류:', countError);
    }

    // 댓글 조회 (페이징)
    const { data, error } = await supabaseAdmin
      .from('advent_comments')
      .select('*')
      .eq('post_dt', postDate)
      .order('reg_dt', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
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

    return {
      comments: commentsWithNames,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      hasMore: (count || 0) > to + 1
    };
  },
  ['advent-comments'], // 캐시 키 prefix
  {
    tags: ['advent-comments'], // revalidateTag로 무효화할 태그
    revalidate: 3600, // 1시간 캐시 유효 기간
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    if (!date || date.length !== 8) {
      return Response.json(
        { error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' },
        { status: 400 }
      );
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // 캐시된 댓글 조회
    const result = await getCachedComments(date, pageNum, limitNum);

    // Edge/CDN 캐싱을 위한 Cache-Control 헤더 설정
    // max-age=0: 브라우저는 항상 재검증 (revalidateTag 무효화 시 즉시 반영)
    // s-maxage=0: Edge/CDN 캐시도 즉시 무효화 (revalidateTag 호출 시 새 데이터 반영)
    // must-revalidate: 캐시 만료 시 반드시 재검증
    const headers = new Headers();
    headers.set(
      'Cache-Control',
      'public, max-age=0, s-maxage=0, must-revalidate'
    );

    return Response.json(result, { headers });
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    return Response.json(
      { error: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { post_dt, content } = body;

    if (!post_dt || !content) {
      return Response.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (typeof post_dt !== 'string' || post_dt.length !== 8) {
      return Response.json(
        { error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return Response.json(
        { error: '댓글은 1000자 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 사용자 ID 처리
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
      return Response.json(
        { error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // ✅ 묵상 저장 성공 시 캐시 즉시 무효화 (App Router에서는 직접 호출 가능)
    try {
      revalidateTag('advent-comments');
      console.log('[캐시 무효화] revalidateTag 완료: advent-comments');
    } catch (cacheError) {
      console.warn('[캐시 무효화] revalidateTag 실패 (무시됨): advent-comments', cacheError);
    }

    // Edge 캐시 무효화를 위한 헤더 설정
    const headers = new Headers();
    headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate'
    );
    headers.set('CDN-Cache-Control', 'no-cache');
    headers.set('Vercel-CDN-Cache-Control', 'no-cache');

    return Response.json({ comment: data }, { status: 201, headers });
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    return Response.json(
      { error: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
