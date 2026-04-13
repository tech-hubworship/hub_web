import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

const ALLOWED_EMAILS = (process.env.UNPAID_TRACKER_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

function hasAccess(session: any) {
  const email = session?.user?.email ?? '';
  return session?.user?.isAdmin && ALLOWED_EMAILS.includes(email);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!hasAccess(session)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if ('sms_sent' in body) updateData.sms_sent = body.sms_sent;
  if ('name' in body) updateData.name = body.name;
  if ('phone' in body) updateData.phone = body.phone;

  const { error } = await supabaseAdmin
    .from('hub_up_unpaid_tracker')
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
  if (!hasAccess(session)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { id } = await ctx.params;
  const { error } = await supabaseAdmin
    .from('hub_up_unpaid_tracker')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
