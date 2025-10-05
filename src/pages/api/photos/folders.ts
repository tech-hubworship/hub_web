import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getFolders(req, res);
      case 'POST':
        return await createFolder(req, res);
      case 'PUT':
        return await updateFolder(req, res);
      case 'DELETE':
        return await deleteFolder(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 폴더 목록 조회
async function getFolders(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('photo_folders')
    .select(`
      id,
      name,
      description,
      is_public,
      order_index,
      created_at,
      photos(count)
    `)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: '폴더 조회 실패' });
  }

  // 사진 수 계산
  const foldersWithCount = data?.map(folder => ({
    ...folder,
    photo_count: folder.photos?.[0]?.count || 0
  })) || [];

  return res.status(200).json({ folders: foldersWithCount });
}

// 폴더 생성
async function createFolder(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, is_public = true, order_index = 0 } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: '폴더명은 필수입니다.' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  // 관리자 확인
  const { data: admin } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('id', session.user.id)
    .in('roles', session.user.roles || [])
    .single();

  if (!admin) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { data, error } = await supabase
    .from('photo_folders')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      is_public,
      order_index,
      created_by: admin.id
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: '폴더 생성 실패' });
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

  // 관리자 확인
  const { data: admin } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('id', session.user.id)
    .in('roles', session.user.roles || [])
    .single();

  if (!admin) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { data, error } = await supabase
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

  // 관리자 확인
  const { data: admin } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('id', session.user.id)
    .in('roles', session.user.roles || [])
    .single();

  if (!admin) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }

  // 폴더 내 사진 수 확인
  const { count } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('folder_id', id);

  if (count && count > 0) {
    return res.status(400).json({ 
      error: `폴더에 ${count}개의 사진이 있습니다. 먼저 사진을 삭제해주세요.` 
    });
  }

  const { error } = await supabase
    .from('photo_folders')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: '폴더 삭제 실패' });
  }

  return res.status(200).json({ message: '폴더가 삭제되었습니다.' });
}
