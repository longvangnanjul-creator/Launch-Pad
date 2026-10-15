import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { runStageAnalysis } from '@/lib/ai';
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

// POST /api/projects/[projectId]/report - Generate report
export async function POST(_request: Request, { params }: Params) {
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

    // Check that validation scorecards exist
    const { data: opportunities, error: oppError } = await supabaseAdmin
      .from('opportunities')
      .select('*')
      .eq('project_id', projectId);

    if (oppError || !opportunities || opportunities.length === 0) {
      return NextResponse.json(
        { error: 'Report cannot be generated until opportunities have been validated. Complete the Opportunities and Validation stages first.' },
        { status: 400 },
      );
    }

    // Get all findings
    const { data: findings } = await supabaseAdmin
      .from('findings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

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

    // Generate report via AI (with fallback)
    const safeFindings = findings || [];
    const safeQuestions = questions || [];

    let reportSections: Array<{ number: number; title: string; content: string }>;
    let reportActionPlan: Array<{ step: string; detail: string; timeframe: string }>;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'REPLACE_WITH_YOUR_OPENAI_API_KEY') {
      const aiResult = await runStageAnalysis(
        'report',
        project,
        safeQuestions,
        evidenceItems || [],
        safeFindings,
        opportunities,
      );
      reportSections = (aiResult.sections || []) as Array<{ number: number; title: string; content: string }>;
      reportActionPlan = (aiResult.actionPlan || []) as Array<{ step: string; detail: string; timeframe: string }>;
    } else {
      reportSections = [
        { number: 1, title: 'Executive Summary', content: `This report summarizes the market analysis for "${project.title}". ${safeQuestions.length} questions were answered, ${safeFindings.length} findings were generated across ${new Set(safeFindings.map(f => f.stage)).size} analysis stages, and ${opportunities.length} opportunities were identified.` },
        { number: 2, title: 'Market', content: `Analysis based on the business idea: ${project.description}` },
        { number: 3, title: 'Target Customer', content: safeFindings.filter(f => f.stage === 'customer').map(f => f.text).join('\n\n') || 'No customer analysis available.' },
        { number: 4, title: 'Customer Problems', content: safeFindings.filter(f => f.stage === 'problem').map(f => f.text).join('\n\n') || 'No problem analysis available.' },
        { number: 5, title: 'Demand', content: safeFindings.filter(f => f.stage === 'demand').map(f => f.text).join('\n\n') || 'No demand analysis available.' },
        { number: 6, title: 'Competitors', content: safeFindings.filter(f => f.stage === 'competitors').map(f => f.text).join('\n\n') || 'No competitor analysis available.' },
        { number: 7, title: 'Market Gaps', content: safeFindings.filter(f => f.stage === 'gaps').map(f => f.text).join('\n\n') || 'No gap analysis available.' },
        { number: 8, title: 'Opportunities', content: opportunities.map(o => `${o.name}: ${o.proposed_solution}`).join('\n\n') || 'No opportunities identified.' },
        { number: 9, title: 'Required Skills', content: opportunities.map(o => o.required_skills).filter(Boolean).join('\n') || 'No skills analysis available.' },
        { number: 10, title: 'Business Models', content: opportunities.map(o => o.business_model).filter(Boolean).join('\n') || 'No business model analysis available.' },
        { number: 11, title: 'Risks', content: opportunities.map(o => o.main_risks || o.risks).filter(Boolean).join('\n') || 'No risk analysis available.' },
        { number: 12, title: 'Validation Plan', content: 'Validate your assumptions by talking to potential customers, testing your offer, and gathering feedback.' },
        { number: 13, title: 'Action Plan', content: 'See the action plan below for concrete next steps.' },
      ];
      reportActionPlan = [
        { step: 'Talk to 5 potential customers', detail: 'Reach out to people who match your target customer profile and ask about their experience with the problem.', timeframe: 'Days 1-3' },
        { step: 'Document competitor pricing', detail: 'Research 3 competitors and document their pricing, strengths, and weaknesses.', timeframe: 'Days 4-5' },
        { step: 'Create a landing page', detail: 'Build a simple page describing your offer and drive 50 visitors to test interest.', timeframe: 'Days 6-10' },
        { step: 'Analyze results and decide', detail: 'Review feedback, competitor research, and landing page metrics. Decide whether to proceed, pivot, or stop.', timeframe: 'Days 11-14' },
      ];
    }

    // Save report to database
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        project_id: projectId,
        sections: JSON.stringify(reportSections),
        action_plan: JSON.stringify(reportActionPlan),
      })
      .select()
      .single();

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    // Update project status
    await supabaseAdmin
      .from('projects')
      .update({ status: 'completed', current_stage: 'report', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    return NextResponse.json({ report });
  } catch (err) {
    console.error('Report generation error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// GET /api/projects/[projectId]/report - Get latest report
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

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('project_id', projectId)
      .order('generated_at', { ascending: false })
      .single();

    if (error || !report) {
      return NextResponse.json({ error: 'No report found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
