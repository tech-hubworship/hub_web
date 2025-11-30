// 파일 경로: src/pages/api/admin/roles/index.ts
// 권한(역할) 목록 조회 및 생성 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  // GET: 권한 목록 조회
  if (req.method === 'GET') {
    try {
      const { data: roles, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching roles:', error);
        return res.status(500).json({ error: '권한 목록을 가져오는 데 실패했습니다.' });
      }

      return res.status(200).json(roles || []);
    } catch (error) {
      console.error('Error in roles API:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }

  // POST: 새 권한 생성
  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: '권한 이름은 필수입니다.' });
      }

      const { data: role, error } = await supabaseAdmin
        .from('roles')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: '이미 존재하는 권한 이름입니다.' });
        }
        console.error('Error creating role:', error);
        return res.status(500).json({ error: '권한 생성에 실패했습니다.' });
      }

      return res.status(201).json(role);
    } catch (error) {
      console.error('Error in roles API:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

