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

    // 구글 드라이브 링크 변환
    const googleDriveIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (googleDriveIdMatch && googleDriveIdMatch[1]) {
      const fileId = googleDriveIdMatch[1];
      targetUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    console.log(`[Download Proxy] Fetching: ${targetUrl}`);

    // 이미지 데이터 가져오기
    const imageResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // 구글이 봇으로 인식하지 않도록 User-Agent를 가짜로 넣어줌
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    if (!imageResponse.ok) {
      console.error(`[Download Proxy] Failed: ${imageResponse.status} ${imageResponse.statusText}`);
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    // 파일 다운로드 헤더 설정
    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
    const finalFilename = typeof filename === 'string' ? filename : 'download.jpg';
    
    // 한글 파일명 깨짐 방지
    const encodedFilename = encodeURIComponent(finalFilename).replace(/['()]/g, escape);

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFilename}`
    );

    // 데이터 전송
    const arrayBuffer = await imageResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));

  } catch (error) {
    console.error('[Download Proxy] Error:', error);
    res.status(500).json({ error: '다운로드에 실패했습니다.' });
  }
}