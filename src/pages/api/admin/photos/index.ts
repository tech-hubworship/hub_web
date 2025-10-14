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
        return await getPhotos(req, res);
      case 'POST':
        return await uploadPhoto(req, res);
      case 'PUT':
        return await updatePhoto(req, res);
      case 'DELETE':
        return await deletePhoto(req, res);
      default:
        return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 사진 목록 조회
async function getPhotos(req: NextApiRequest, res: NextApiResponse) {
  const { folder_id, page = 1, limit = 20 } = req.query;

  let query = supabaseClient
    .from('photos')
    .select(`
      id,
      title,
      description,
      image_url,
      thumbnail_url,
      file_size,
      width,
      height,
      file_format,
      is_active,
      created_at,
      photo_folders!inner(id, name)
    `)
    .eq('is_active', true);

  if (folder_id) {
    query = query.eq('folder_id', folder_id);
  }

  // 페이지네이션
  const offset = (Number(page) - 1) * Number(limit);
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;

  if (error) {
    return res.status(500).json({ error: '사진 조회 실패' });
  }

  return res.status(200).json({
    photos: data || [],
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      pages: Math.ceil((count || 0) / Number(limit))
    }
  });
}

// 사진 업로드 (링크)
async function uploadPhoto(req: NextApiRequest, res: NextApiResponse) {
  const { 
    folder_id, 
    title, 
    description, 
    image_url, 
    thumbnail_url,
    file_size,
    width,
    height,
    file_format
  } = req.body;

  if (!folder_id) {
    return res.status(400).json({ error: '폴더 ID는 필수입니다.' });
  }

  if (!image_url || image_url.trim() === '') {
    return res.status(400).json({ error: '사진 링크는 필수입니다.' });
  }

  // URL 유효성 검사
  try {
    new URL(image_url);
  } catch {
    return res.status(400).json({ error: '유효하지 않은 사진 링크입니다.' });
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

  // 폴더 존재 확인
  const { data: folder } = await supabaseClient
    .from('photo_folders')
    .select('id')
    .eq('id', folder_id)
    .single();

  if (!folder) {
    return res.status(404).json({ error: '폴더를 찾을 수 없습니다.' });
  }

  const { data, error } = await supabaseClient
    .from('photos')
    .insert({
      folder_id,
      title: title?.trim() || null,
      description: description?.trim() || null,
      image_url: image_url.trim(),
      thumbnail_url: thumbnail_url?.trim() || null,
      file_size,
      width,
      height,
      file_format,
      uploaded_by: session.user.id
    })
    .select(`
      id,
      title,
      description,
      image_url,
      thumbnail_url,
      file_size,
      width,
      height,
      file_format,
      is_active,
      created_at,
      photo_folders!inner(id, name)
    `)
    .single();

  if (error) {
    return res.status(500).json({ error: '사진 업로드 실패' });
  }

  return res.status(201).json({ photo: data });
}

// 사진 수정
async function updatePhoto(req: NextApiRequest, res: NextApiResponse) {
  const { 
    id, 
    title, 
    description, 
    image_url, 
    thumbnail_url,
    file_size,
    width,
    height,
    file_format
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: '사진 ID는 필수입니다.' });
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

  const updateData: any = {};
  if (title !== undefined) updateData.title = title?.trim() || null;
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (image_url !== undefined) updateData.image_url = image_url?.trim() || null;
  if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url?.trim() || null;
  if (file_size !== undefined) updateData.file_size = file_size;
  if (width !== undefined) updateData.width = width;
  if (height !== undefined) updateData.height = height;
  if (file_format !== undefined) updateData.file_format = file_format;

  const { data, error } = await supabaseClient
    .from('photos')
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      title,
      description,
      image_url,
      thumbnail_url,
      file_size,
      width,
      height,
      file_format,
      is_active,
      created_at,
      photo_folders!inner(id, name)
    `)
    .single();

  if (error) {
    return res.status(500).json({ error: '사진 수정 실패' });
  }

  return res.status(200).json({ photo: data });
}

// 사진 삭제 (소프트 삭제)
async function deletePhoto(req: NextApiRequest, res: NextApiResponse) {
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

  // --- 다중 삭제 로직 ---
  const { ids } = req.body;
  if (ids && Array.isArray(ids) && ids.length > 0) {
    const { error } = await supabaseClient
      .from('photos')
      .update({ is_active: false })
      .in('id', ids);

    if (error) {
      console.error('다중 사진 삭제 오류:', error);
      return res.status(500).json({ error: '선택된 사진 삭제에 실패했습니다.' });
    }
    return res.status(200).json({ message: `${ids.length}개의 사진이 삭제되었습니다.` });
  }

  // --- 단일 삭제 로직 ---
  const { id } = req.query;
  if (id) {
    const { error } = await supabaseClient
      .from('photos')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('단일 사진 삭제 오류:', error);
      return res.status(500).json({ error: '사진 삭제에 실패했습니다.' });
    }
    return res.status(200).json({ message: '사진이 삭제되었습니다.' });
  }
}