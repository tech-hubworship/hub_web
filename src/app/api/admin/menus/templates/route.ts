import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { requireAdminSession } from '@src/lib/api/auth';

interface MenuTemplate {
  menu_id: string;
  title: string;
  icon: string;
  path: string;
  description: string;
  category: string;
}

// 아이콘 매핑 (메뉴 ID 기반)
const ICON_MAP: Record<string, string> = {
  'glossary': '📖',
  'apps-glossary': '📖',
  'prayer-time': '⏱️',
  'apps-prayer-time': '⏱️',
  'calendar': '📅',
  'ice-breaking': '🎲',
  'bible-card': '📿',
  'photos': '📷',
  'attendance': '✅',
  'advent': '🎄',
  'users': '👥',
  'roles': '🔐',
  'tech-inquiries': '💬',
};

// 기본 아이콘
const DEFAULT_ICON = '📋';

// 템플릿 목록에서 제외할 메뉴 ID (DB 추가 없이 항상 표시되는 메뉴만)
const EXCLUDED_FROM_TEMPLATES: string[] = [];

// 메타데이터에서 정보 추출
async function extractMetadataFromPage(filePath: string): Promise<{ title?: string; description?: string }> {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // title 추출 (여러 패턴 지원)
    const titlePatterns = [
      /title:\s*["']([^"']+)["']/,  // title: "제목"
      /title:\s*`([^`]+)`/,          // title: `제목`
    ];
    
    let title: string | undefined;
    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        break;
      }
    }
    
    // description 추출 (여러 패턴 지원)
    const descPatterns = [
      /description:\s*["']([^"']+)["']/,  // description: "설명"
      /description:\s*`([^`]+)`/,          // description: `설명`
    ];
    
    let description: string | undefined;
    for (const pattern of descPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        description = match[1].trim();
        break;
      }
    }
    
    return { title, description };
  } catch (error) {
    return {};
  }
}

// Apps 디렉토리 스캔
async function scanAdminAppsDirectory(): Promise<MenuTemplate[]> {
  const appsDir = join(process.cwd(), 'src/app/admin/apps');
  
  try {
    // 디렉토리 존재 확인
    try {
      const dirStats = await stat(appsDir);
      if (!dirStats.isDirectory()) {
        return [];
      }
    } catch (error) {
      return [];
    }
    
    return await scanDirectoryRecursive(appsDir, 'apps', 'Apps');
  } catch (error) {
    return [];
  }
}

// 재귀적으로 디렉토리 스캔 (현재 디렉터리의 page.tsx + 하위 디렉터리)
async function scanDirectoryRecursive(
  dirPath: string,
  basePath: string,
  category: string
): Promise<MenuTemplate[]> {
  const templates: MenuTemplate[] = [];

  try {
    // 현재 디렉터리에 page.tsx가 있으면 템플릿으로 추가 (예: admin/calendar/page.tsx)
    const currentPagePath = join(dirPath, 'page.tsx');
    try {
      const currentPageStats = await stat(currentPagePath);
      if (currentPageStats.isFile()) {
        const metadata = await extractMetadataFromPage(currentPagePath);
        const relativePath = basePath.replace(/^\//, '');
        const menuId = relativePath.replace(/\//g, '-');
        const path = `/admin/${relativePath}`;
        const lastSegment = basePath.split('/').pop() || basePath;
        const title = metadata.title || lastSegment;
        const description = metadata.description || `${title} 관리`;
        const icon = ICON_MAP[menuId] || ICON_MAP[lastSegment] || DEFAULT_ICON;
        templates.push({
          menu_id: menuId,
          title,
          icon,
          path,
          description,
          category,
        });
      }
    } catch {
      // 현재 디렉터리에 page.tsx 없음 → 하위만 스캔
    }

    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const dirName = entry.name;
      const fullDirPath = join(dirPath, dirName);
      const pagePath = join(fullDirPath, 'page.tsx');
      
      // page.tsx 파일 존재 확인
      let hasPage = false;
      try {
        const stats = await stat(pagePath);
        hasPage = stats.isFile();
      } catch (error) {
        // page.tsx가 없으면 하위 디렉토리 스캔
        const subTemplates = await scanDirectoryRecursive(
          fullDirPath,
          `${basePath}/${dirName}`,
          category
        );
        templates.push(...subTemplates);
        continue;
      }
      
      if (!hasPage) continue;
      
      // 메타데이터 추출
      const metadata = await extractMetadataFromPage(pagePath);
      
      // menu_id는 경로 기반으로 생성 (슬래시를 하이픈으로 변환)
      const relativePath = `${basePath}/${dirName}`.replace(/^\//, '');
      const menuId = relativePath.replace(/\//g, '-');
      const path = `/admin/${relativePath}`;
      const title = metadata.title || dirName;
      const description = metadata.description || `${title} 관리`;
      const icon = ICON_MAP[menuId] || ICON_MAP[dirName] || DEFAULT_ICON;
      
      templates.push({
        menu_id: menuId,
        title,
        icon,
        path,
        description,
        category,
      });
    }
  } catch (error) {
    // 에러 발생 시 빈 배열 반환
  }
  
  return templates;
}

// 다른 admin 디렉토리도 스캔 (선택적)
async function scanAdminDirectory(): Promise<MenuTemplate[]> {
  const templates: MenuTemplate[] = [];
  const adminDir = join(process.cwd(), 'src/app/admin');
  
  try {
    const entries = await readdir(adminDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const dirName = entry.name;
      
      // apps는 이미 스캔했으므로 제외
      if (dirName === 'apps') continue;
      
      const fullDirPath = join(adminDir, dirName);
      
      // 재귀적으로 스캔
      const subTemplates = await scanDirectoryRecursive(
        fullDirPath,
        dirName,
        '기타'
      );
      templates.push(...subTemplates);
    }
  } catch (error) {
    console.error('Error scanning admin directory:', error);
  }
  
  return templates;
}

export async function GET(req: Request) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // Apps 디렉토리 스캔
    const appsTemplates = await scanAdminAppsDirectory();
    
    // 다른 Admin 디렉토리 스캔
    const otherTemplates = await scanAdminDirectory();
    
    // 중복 제거 (menu_id 기준) + 템플릿 추가에서 제외할 메뉴 필터
    const allTemplates = [...appsTemplates, ...otherTemplates];
    const uniqueTemplates = Array.from(
      new Map(allTemplates.map(t => [t.menu_id, t])).values()
    ).filter((t) => !EXCLUDED_FROM_TEMPLATES.includes(t.menu_id));

    return NextResponse.json(uniqueTemplates);
  } catch (error) {
    return NextResponse.json(
      { error: '템플릿을 가져오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}
