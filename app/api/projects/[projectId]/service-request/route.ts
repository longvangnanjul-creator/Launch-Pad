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

// POST /api/projects/[projectId]/service-request - Submit a service request
export async function POST(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;
    const body = await request.json();

    const serviceType = typeof body.serviceType === 'string' ? body.serviceType : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const budget = typeof body.budget === 'string' ? body.budget.trim() : '';
    const timeline = typeof body.timeline === 'string' ? body.timeline.trim() : '';

    if (!serviceType || !description) {
      return NextResponse.json({ error: 'Service type and description are required.' }, { status: 400 });
    }

    // Store service request in a JSONB column on the project (or create a separate table)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Save service request as a finding with special stage
    const { error: insertError } = await supabaseAdmin
      .from('findings')
      .insert({
        project_id: projectId,
        stage: 'service_request',
        kind: 'user_decision',
        text: `Service Request: ${serviceType}. ${description}. Budget: ${budget || 'Not specified'}. Timeline: ${timeline || 'Not specified'}.`,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Service request submitted. Our team will review it and connect you with an expert.' });
  } catch (err) {
    console.error('Service request error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
