// 파일 경로: src/pages/api/bible-card/pastor/bible.ts
// 목회자: 성경 데이터 조회 API (통합)

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 목회자 권한 확인
    const userRoles = session.user.roles || [];
    if (!userRoles.includes('목회자')) {
      return res.status(403).json({ error: '목회자 권한이 필요합니다.' });
    }

    const { type, book, chapter, verse } = req.query;

    // 1. 책 목록 조회
    if (type === 'books') {
      // 페이지네이션을 사용하여 모든 데이터 가져오기
      const bookMap = new Map<string, { id: number; full_name: string; short_name: string }>();
      let offset = 0;
      const limit = 1000; // Supabase 기본 limit
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabaseAdmin
          .from('bible')
          .select('id, book_full_name, book_name')
          .order('id', { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('Error fetching books:', error);
          return res.status(500).json({ error: '책 목록 조회 실패' });
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        // 각 책의 첫 번째 id를 기준으로 중복 제거
        for (const item of data) {
          if (!bookMap.has(item.book_full_name)) {
            bookMap.set(item.book_full_name, {
              id: item.id,
              full_name: item.book_full_name,
              short_name: item.book_name,
            });
          }
        }

        // 더 가져올 데이터가 있는지 확인
        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      if (bookMap.size === 0) {
        return res.status(404).json({ error: '책 목록을 찾을 수 없습니다.' });
      }

      // id 순서대로 정렬 (성경 순서 유지)
      const uniqueBooks = Array.from(bookMap.values()).sort((a, b) => a.id - b.id);

      console.log(`[Bible API] 총 ${uniqueBooks.length}개 책 발견`);
      console.log(`[Bible API] 첫 10개 책:`, uniqueBooks.slice(0, 10).map(b => `${b.full_name}(${b.short_name})`));

      return res.status(200).json(
        uniqueBooks.map((item) => ({
          id: item.id,
          full_name: item.full_name,
          short_name: item.short_name,
        }))
      );
    }

    // 2. 장 목록 조회
    if (type === 'chapters' && book) {
      // 시편일 경우 여러 번 조회해서 합치기 (50편씩)
      const isPsalms = book === '시' || book === '시편';
      
      if (isPsalms) {
        const allChapters = new Set<number>();
        const chapterRanges = [
          { start: 1, end: 50 },
          { start: 51, end: 100 },
          { start: 101, end: 150 },
        ];

        for (const range of chapterRanges) {
          const { data, error } = await supabaseAdmin
            .from('bible')
            .select('chapter, book_full_name')
            .eq('book_name', book)
            .gte('chapter', range.start)
            .lte('chapter', range.end)
            .order('chapter', { ascending: true });

          if (error) {
            console.error(`Error fetching chapters ${range.start}-${range.end}:`, error);
            continue; // 에러가 나도 다음 범위 계속 시도
          }

          if (data && data.length > 0) {
            data.forEach((item: any) => {
              allChapters.add(item.chapter);
            });
          }
        }

        if (allChapters.size === 0) {
          return res.status(404).json({ error: '시편 장 목록을 찾을 수 없습니다.' });
        }

        const chapters = Array.from(allChapters).sort((a, b) => a - b);
        return res.status(200).json({
          book: '시편',
          chapters,
        });
      } else {
        // 시편이 아닌 경우 기존 로직 사용
        const { data, error } = await supabaseAdmin
          .from('bible')
          .select('chapter, book_full_name')
          .eq('book_name', book)
          .order('chapter', { ascending: true });

        if (error) {
          console.error('Error fetching chapters:', error);
          return res.status(500).json({ error: '장 목록 조회 실패' });
        }

        if (!data || data.length === 0) {
          return res.status(404).json({ error: '책을 찾을 수 없습니다.' });
        }

        const chapters = Array.from(new Set(data.map((item: any) => item.chapter))).sort((a, b) => a - b);
        return res.status(200).json({
          book: data[0]?.book_full_name || book,
          chapters,
        });
      }
    }

    // 3. 절 목록 조회
    if (type === 'verses' && book && chapter) {
      const chapterNum = parseInt(chapter as string, 10);
      if (isNaN(chapterNum)) {
        return res.status(400).json({ error: '올바른 장 번호가 아닙니다.' });
      }

      const { data, error } = await supabaseAdmin
        .from('bible')
        .select('verse, book_full_name')
        .eq('book_name', book)
        .eq('chapter', chapterNum)
        .order('verse', { ascending: true });

      if (error) {
        console.error('Error fetching verses:', error);
        return res.status(500).json({ error: '절 목록 조회 실패' });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: '장을 찾을 수 없습니다.' });
      }

      const verses = Array.from(new Set(data.map((item: any) => item.verse))).sort((a, b) => a - b);
      return res.status(200).json({
        book: data[0]?.book_full_name || book,
        chapter: chapterNum,
        verses,
      });
    }

    // 4. 본문 조회 (범위 지원)
    if (type === 'text' && book && chapter && verse) {
      const chapterNum = parseInt(chapter as string, 10);
      const verseStr = verse as string;
      
      if (isNaN(chapterNum)) {
        return res.status(400).json({ error: '올바른 장 번호가 아닙니다.' });
      }

      // 범위 파싱 (예: "1-2" 또는 "1")
      const verseRange = verseStr.includes('-') 
        ? verseStr.split('-').map(v => parseInt(v.trim(), 10))
        : [parseInt(verseStr, 10)];

      if (verseRange.some(v => isNaN(v))) {
        return res.status(400).json({ error: '올바른 절 번호가 아닙니다.' });
      }

      const startVerse = verseRange[0];
      const endVerse = verseRange.length > 1 ? verseRange[1] : startVerse;

      if (endVerse < startVerse) {
        return res.status(400).json({ error: '절 범위가 올바르지 않습니다.' });
      }

      // 여러 절 조회
      const { data, error } = await supabaseAdmin
        .from('bible')
        .select('verse, content, book_full_name')
        .eq('book_name', book)
        .eq('chapter', chapterNum)
        .gte('verse', startVerse)
        .lte('verse', endVerse)
        .order('verse', { ascending: true });

      if (error) {
        console.error('Error fetching verse text:', error);
        return res.status(500).json({ error: '본문 조회 실패' });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: '구절을 찾을 수 없습니다.' });
      }

      // 본문 합치기
      const texts = data.map(item => item.content).filter(Boolean);
      const combinedText = texts.join(' ');

      const bookFullName = data[0]?.book_full_name || book;
      const reference = endVerse > startVerse 
        ? `${bookFullName} ${chapterNum}:${startVerse}-${endVerse}`
        : `${bookFullName} ${chapterNum}:${startVerse}`;

      return res.status(200).json({
        reference,
        text: combinedText,
      });
    }

    return res.status(400).json({ error: '잘못된 요청입니다.' });
  } catch (error) {
    console.error('Error in bible API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

