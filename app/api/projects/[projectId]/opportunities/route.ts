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

type Params = { params: Promise<{ projectId: string; oppId?: string }> };

// GET /api/projects/[projectId]/opportunities - List opportunities
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

    const { data: opportunities, error } = await supabaseAdmin
      .from('opportunities')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ opportunities: opportunities || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/opportunities - Create new opportunity
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

    const { data: opportunity, error } = await supabaseAdmin
      .from('opportunities')
      .insert({
        project_id: projectId,
        name: body.name || 'New Opportunity',
        customer: body.customer || '',
        problem: body.problem || '',
        proposed_solution: body.proposedSolution || '',
        why_it_exists: body.whyItExists || '',
        alternatives: body.alternatives || '',
        differentiation: body.differentiation || '',
        required_skills: body.requiredSkills || '',
        business_model: body.businessModel || '',
        risks: body.risks || '',
        validation_steps: body.validationSteps || '',
        demand_evidence: body.demandEvidence || '',
        demand_evidence_kind: body.demandEvidenceKind || 'no_evidence',
        problem_severity: body.problemSeverity || 'medium',
        competition: body.competition || 'medium',
        market_gap: body.marketGap || '',
        market_gap_kind: body.marketGapKind || 'no_evidence',
        monetization: body.monetization || '',
        skills: body.skills || '',
        main_risks: body.mainRisks || '',
        evidence_strength: body.evidenceStrength || 'limited',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// PATCH /api/projects/[projectId]/opportunities/[oppId] - Update opportunity
export async function PATCH(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  }

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, oppId } = await params;
    const updates = await request.json();

    const allowedFields = [
      'name', 'customer', 'problem', 'proposed_solution', 'why_it_exists',
      'alternatives', 'differentiation', 'required_skills', 'business_model',
      'risks', 'validation_steps', 'demand_evidence', 'demand_evidence_kind',
      'problem_severity', 'competition', 'market_gap', 'market_gap_kind',
      'monetization', 'skills', 'main_risks', 'evidence_strength',
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key];
      }
    }

    const { data: opportunity, error } = await supabaseAdmin
      .from('opportunities')
      .update(filteredUpdates)
      .eq('id', oppId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error || !opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({ opportunity });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// DELETE /api/projects/[projectId]/opportunities/[oppId] - Delete opportunity
export async function DELETE(_request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  }

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, oppId } = await params;

    const { error } = await supabaseAdmin
      .from('opportunities')
      .delete()
      .eq('id', oppId)
      .eq('project_id', projectId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
