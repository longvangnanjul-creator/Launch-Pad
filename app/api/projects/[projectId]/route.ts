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

// GET /api/projects/[projectId] - Get a single project
export async function GET(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// PATCH /api/projects/[projectId] - Update project
export async function PATCH(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const updates = await request.json();

    // Only allow updating specific fields
    const allowedFields = ['title', 'description', 'current_stage', 'status', 'launch_checklist', 'business_details', 'business_blueprint'];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        if (['launch_checklist', 'business_details', 'business_blueprint'].includes(key)) {
          const value = updates[key];
          const isValidJsonShape = key === 'launch_checklist'
            ? Array.isArray(value) && value.length <= 100
            : value !== null && typeof value === 'object' && !Array.isArray(value);
          if (!isValidJsonShape) {
            return NextResponse.json({ error: `Invalid ${key} value.` }, { status: 400 });
          }
          filteredUpdates[key] = value;
        } else if (typeof updates[key] === 'string') {
          filteredUpdates[key] = updates[key].slice(0, 5000);
        }
      }
    }

    filteredUpdates['updated_at'] = new Date().toISOString();

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update(filteredUpdates)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// DELETE /api/projects/[projectId] - Delete project
export async function DELETE(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
