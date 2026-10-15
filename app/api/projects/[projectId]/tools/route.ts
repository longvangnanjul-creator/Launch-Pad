import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

async function getUserId(supabaseAdmin: SupabaseClient) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) return null;
  return user.id;
}

type Params = { params: Promise<{ projectId: string }> };

// GET /api/projects/[projectId]/tools - Get tools data
export async function GET(_request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('business_tools')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json({ tools: project.business_tools || null });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/tools - Save tools data
export async function POST(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;
    const toolsData = await request.json();

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ business_tools: toolsData, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
