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

// GET /api/projects/[projectId]/evidence - List evidence items
export async function GET(_request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  }

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    const { data: evidence, error } = await supabaseAdmin
      .from('evidence_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ evidence: evidence || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/evidence - Add evidence item
export async function POST(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  }

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();

    const quoteOrNote = typeof body.quoteOrNote === 'string' ? body.quoteOrNote.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : null;
    const stage = typeof body.stage === 'string' ? body.stage : 'general';
    const sourceLabel = typeof body.sourceLabel === 'string' ? body.sourceLabel.trim() : 'user note';

    if (!quoteOrNote) {
      return NextResponse.json({ quoteOrNote: 'A quote or note is required.' }, { status: 400 });
    }

    const { data: evidence, error } = await supabaseAdmin
      .from('evidence_items')
      .insert({
        project_id: projectId,
        stage,
        url,
        quote_or_note: quoteOrNote,
        source_label: sourceLabel,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ evidence }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// DELETE /api/projects/[projectId]/evidence - Remove evidence item
export async function DELETE(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  }

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const evidenceId = searchParams.get('evidenceId');

    if (!evidenceId) {
      return NextResponse.json({ error: 'Evidence ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('evidence_items')
      .delete()
      .eq('id', evidenceId)
      .eq('project_id', projectId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
