import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

// 서비스 키를 사용한 Supabase 클라이언트 (RLS 우회)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getFolders(req, res);
      case 'POST':
        return await createFolder(req, res);
      case 'PUT':
        return await updateFolder(req, res);
      case 'DELETE':
        return await deleteFolder(req, res);
      default:
        return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 폴더 목록 조회
async function getFolders(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabaseClient
    .from('photo_folders')
    .select(`
      id,
      name,
      description,
      is_public,
      order_index,
      created_at
    `)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: '폴더 조회 실패' });
  }

  // 각 폴더별로 활성 사진 수 계산
  const foldersWithCount = await Promise.all(
    (data || []).map(async (folder) => {
      const { count } = await supabaseClient
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('folder_id', folder.id)
        .eq('is_active', true);

      return {
        ...folder,
        photo_count: count || 0
      };
    })
  );

  return res.status(200).json({ folders: foldersWithCount });
}

// 폴더 생성
async function createFolder(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, is_public = true, order_index = 0 } = req.body;

  console.log('Create folder request body:', { name, description, is_public, order_index });

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: '폴더명은 필수입니다.' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  // 관리자 확인 (profiles 테이블의 status가 '관리자'이거나 admin_roles에 권한이 있는 경우)
  console.log('Checking admin permissions for user:', session.user.id);
  console.log('User roles from session:', session.user.roles);

  // 1. profiles 테이블에서 관리자 상태 확인
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('user_id, name, status')
    .eq('user_id', session.user.id)
    .eq('status', '관리자')
    .single();

  console.log('Profile check result:', { profile, profileError });

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

  console.log('Admin roles check result:', { adminRoles, adminError });

  // 3. 권한 확인 (관리자 상태이거나 역할 권한이 있는 경우)
  const isAdmin = profile && profile.status === '관리자';
  const hasRole = adminRoles && adminRoles.length > 0;
  const admin = isAdmin || hasRole;

  if (!admin) {
    console.log('Access denied - no admin status or roles found');
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }

  console.log('Admin access granted - isAdmin:', isAdmin, 'hasRole:', hasRole);

  console.log('Creating folder with data:', {
    name: name.trim(),
    description: description?.trim() || null,
    is_public,
    order_index,
    created_by: session.user.id
  });

  const { data, error } = await supabaseClient
    .from('photo_folders')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      is_public,
      order_index,
      created_by: session.user.id
    })
    .select()
    .single();

  console.log('Folder creation result:', { data, error });

  if (error) {
    console.error('폴더 생성 에러:', error);
    return res.status(500).json({ error: '폴더 생성 실패', details: error.message });
  }

  return res.status(201).json({ folder: data });
}

// 폴더 수정
async function updateFolder(req: NextApiRequest, res: NextApiResponse) {
  const { id, name, description, is_public, order_index } = req.body;

  if (!id) {
    return res.status(400).json({ error: '폴더 ID는 필수입니다.' });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: '폴더명은 필수입니다.' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  // 관리자 확인 (여러 역할 중 하나라도 있으면 통과)
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

  const admin = adminRoles && adminRoles.length > 0;

  if (!admin) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { data, error } = await supabaseClient
    .from('photo_folders')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      is_public,
      order_index
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: '폴더 수정 실패' });
  }

  return res.status(200).json({ folder: data });
}

// 폴더 삭제
async function deleteFolder(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: '폴더 ID는 필수입니다.' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  // 관리자 확인 (여러 역할 중 하나라도 있으면 통과)
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

  const admin = adminRoles && adminRoles.length > 0;

  if (!admin) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }

  // 폴더 내 사진 수 확인
  const { count } = await supabaseClient
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('folder_id', id)
    .eq('is_active', true);

  if (count && count > 0) {
    return res.status(400).json({ 
      error: `폴더에 ${count}개의 사진이 있어 삭제할 수 없습니다.` 
    });
  }

  const { error } = await supabaseClient
    .from('photo_folders')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: '폴더 삭제에 실패했습니다.' });
  }

  return res.status(200).json({ message: '폴더가 삭제되었습니다.' });
}