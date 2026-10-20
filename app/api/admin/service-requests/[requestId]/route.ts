import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

async function getUserEmail(supabaseAdmin: SupabaseClient) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) return null;
  return user.email || null;
}

const ADMIN_EMAILS = ['longvangnanjul@gmail.com'];

type Params = { params: Promise<{ requestId: string }> };

// PATCH /api/admin/service-requests/[requestId] - Update request status (admin only)
export async function PATCH(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  const email = await getUserEmail(supabaseAdmin);
  if (!ADMIN_EMAILS.includes((email || '').toLowerCase())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId } = await params;
  const { status } = await request.json();

  const { data: updated, error } = await supabaseAdmin
    .from('service_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ request: updated });
}
