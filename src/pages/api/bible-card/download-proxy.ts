// 파일 경로: src/pages/api/bible-card/download-proxy.ts
// 말씀카드 다운로드 프록시 Private API

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, filename } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    let targetUrl = url;
    let fileId: string | null = null;

    // 구글 드라이브 링크에서 파일 ID 추출
    const googleDriveIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (googleDriveIdMatch && googleDriveIdMatch[1]) {
      fileId = googleDriveIdMatch[1];
    }

    // 여러 구글 드라이브 URL 형식 시도
    const urlAttempts: string[] = [];
    
    if (fileId) {
      // 방법 1: uc?export=download (가장 일반적)
      urlAttempts.push(`https://drive.google.com/uc?export=download&id=${fileId}`);
      // 방법 2: uc?export=view (뷰 모드)
      urlAttempts.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
      // 방법 3: thumbnail (썸네일)
      urlAttempts.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`);
    } else {
      urlAttempts.push(url);
    }

    let imageResponse: Response | null = null;
    let lastError: Error | null = null;

    // 각 URL 시도
    for (const attemptUrl of urlAttempts) {
      try {
        console.log(`[Download Proxy] Trying: ${attemptUrl}`);

        imageResponse = await fetch(attemptUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': 'https://drive.google.com/',
      },
    });

        if (imageResponse.ok && imageResponse.headers.get('content-type')?.startsWith('image/')) {
          console.log(`[Download Proxy] Success with: ${attemptUrl}`);
          break;
        } else {
          console.log(`[Download Proxy] Failed with status ${imageResponse.status} for: ${attemptUrl}`);
          imageResponse = null;
        }
      } catch (error) {
        console.log(`[Download Proxy] Error for ${attemptUrl}:`, error);
        lastError = error as Error;
        imageResponse = null;
      }
    }

    if (!imageResponse || !imageResponse.ok) {
      console.error(`[Download Proxy] All attempts failed. Last error:`, lastError);
      throw new Error(`Failed to fetch image: ${imageResponse?.status || 'unknown'}`);
    }

    // 파일 다운로드 헤더 설정
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Content-Type에 맞는 확장자 결정
    let extension = '.jpg';
    if (contentType.includes('png')) {
      extension = '.png';
    } else if (contentType.includes('webp')) {
      extension = '.webp';
    } else if (contentType.includes('gif')) {
      extension = '.gif';
    }
    
    // filename에서 기존 확장자 제거하고 새로운 확장자 추가
    let finalFilename: string;
    if (typeof filename === 'string' && filename.trim()) {
      // 기존 확장자 제거 (마지막 .xxx 패턴)
      const nameWithoutExt = filename.replace(/\.[^.]*$/, '');
      finalFilename = nameWithoutExt + extension;
    } else {
      finalFilename = `download${extension}`;
    }
    
    // 쿼리 파라미터로 view 모드 확인 (이미지 표시용)
    const isViewMode = req.query.view === 'true';

    res.setHeader('Content-Type', contentType);
    
    if (!isViewMode) {
      // 다운로드 모드일 때만 Content-Disposition 설정
      const encodedFilename = encodeURIComponent(finalFilename).replace(/['()]/g, escape);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFilename}`
    );
    } else {
      // 이미지 표시 모드일 때는 CORS 헤더 추가
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // 데이터 전송
    const arrayBuffer = await imageResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));

  } catch (error) {
    console.error('[Download Proxy] Error:', error);
    res.status(500).json({ error: '다운로드에 실패했습니다.' });
  }
}