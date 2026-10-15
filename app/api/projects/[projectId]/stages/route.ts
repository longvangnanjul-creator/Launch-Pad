import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { runStageAnalysis, type StageFindings } from '@/lib/ai';
import { cookies } from 'next/headers';

async function getUserId(supabaseAdmin: SupabaseClient) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) return null;
  return user.id;
}

const VALID_STAGES = ['customer', 'problem', 'demand', 'competitors', 'gaps', 'opportunities', 'validation'];

type Params = { params: Promise<{ projectId: string }> };

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
    const { stage } = await request.json();

    if (!stage || !VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage.' }, { status: 400 });
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get question turns
    const { data: questions } = await supabaseAdmin
      .from('question_turns')
      .select('*')
      .eq('project_id', projectId)
      .order('turn_index', { ascending: true });

    // Get evidence items
    const { data: evidenceItems } = await supabaseAdmin
      .from('evidence_items')
      .select('*')
      .eq('project_id', projectId);

    // Get previous findings
    const { data: existingFindings } = await supabaseAdmin
      .from('findings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    // Get opportunities for validation stage
    let opportunities: Array<{ id: string; name: string }> = [];
    if (stage === 'validation') {
      const { data: opps } = await supabaseAdmin
        .from('opportunities')
        .select('id, name')
        .eq('project_id', projectId);
      opportunities = opps || [];
    }

    // Run AI analysis (with fallback)
    const result: StageFindings = await runStageAnalysis(
      stage,
      project,
      questions || [],
      evidenceItems || [],
      existingFindings || [],
      opportunities,
    );

    // Save findings to database
    if (result.findings && result.findings.length > 0) {
      for (const finding of result.findings) {
        await supabaseAdmin.from('findings').insert({
          project_id: projectId,
          stage,
          kind: finding.kind,
          text: finding.text,
          gap_type: (finding as Record<string, unknown>).gapType as string || null,
        });
      }
    }

    // Save opportunities if generated
    if (stage === 'opportunities' && result.opportunities) {
      for (const opp of result.opportunities as Array<Record<string, string>>) {
        await supabaseAdmin.from('opportunities').insert({
          project_id: projectId,
          name: opp.name || '',
          customer: opp.customer || '',
          problem: opp.problem || '',
          proposed_solution: opp.proposedSolution || '',
          why_it_exists: opp.whyItExists || '',
          alternatives: opp.alternatives || '',
          differentiation: opp.differentiation || '',
          required_skills: opp.requiredSkills || '',
          business_model: opp.businessModel || '',
          risks: opp.risks || '',
          validation_steps: opp.validationSteps || '',
          demand_evidence: '',
          demand_evidence_kind: 'no_evidence',
          problem_severity: 'medium',
          competition: 'medium',
          market_gap: '',
          market_gap_kind: 'no_evidence',
          monetization: '',
          skills: '',
          main_risks: '',
          evidence_strength: 'limited',
        });
      }
    }

    // Update project stage
    await supabaseAdmin
      .from('projects')
      .update({ current_stage: stage, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    // Return findings directly so client can display them
    return NextResponse.json({ findings: result.findings || [], summary: result.summary || '', stage });
  } catch (err) {
    console.error('Stage analysis error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

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

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: findings, error } = await supabaseAdmin
      .from('findings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ findings: findings || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
