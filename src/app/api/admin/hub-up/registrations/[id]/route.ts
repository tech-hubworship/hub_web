import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { room_number, room_note, admin_deposit_confirm } = body;

  const updateData: Record<string, any> = {};
  if ('room_number' in body) updateData.room_number = room_number ?? null;
  if ('room_note' in body) updateData.room_note = room_note ?? null;
  if ('admin_deposit_confirm' in body) updateData.admin_deposit_confirm = admin_deposit_confirm;

  const { error } = await supabaseAdmin
    .from('hub_up_registrations')
    .update(updateData)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { id } = await ctx.params;

  const { error } = await supabaseAdmin
    .from('hub_up_registrations')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
