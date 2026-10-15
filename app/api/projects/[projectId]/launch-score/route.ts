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

export async function GET(_request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Calculate launch score based on completed stages and data
    const findings = await supabaseAdmin.from('findings').select('stage').eq('project_id', projectId);
    const opportunities = await supabaseAdmin.from('opportunities').select('id').eq('project_id', projectId);
    const reports = await supabaseAdmin.from('reports').select('id').eq('project_id', projectId);

    const completedStages = new Set(findings.data?.map((f) => f.stage) || []);
    const hasBlueprint = !!project.business_blueprint;
    const hasBrand = !!project.business_brand;
    const hasWebsite = !!project.business_website;
    const hasMarketing = !!project.business_marketing;
    const hasChecklist = !!project.launch_checklist;
    const hasOpportunities = (opportunities.data?.length || 0) > 0;
    const hasReport = (reports.data?.length || 0) > 0;
    const questionCount = project.current_stage === 'questioning' ? 0 : 1;

    // Score breakdown (total 100)
    const breakdown = {
      businessClarity: Math.min(20, (hasBlueprint ? 10 : 0) + (questionCount > 0 ? 10 : 0)),
      marketResearch: Math.min(25, (completedStages.has('customer') ? 5 : 0) + (completedStages.has('problem') ? 5 : 0) + (completedStages.has('demand') ? 5 : 0) + (completedStages.has('competitors') ? 5 : 0) + (completedStages.has('gaps') ? 5 : 0)),
      opportunities: Math.min(15, (hasOpportunities ? 10 : 0) + (completedStages.has('validation') ? 5 : 0)),
      branding: hasBrand ? 15 : 0,
      onlinePresence: hasWebsite ? 10 : 0,
      marketing: hasMarketing ? 10 : 0,
      launchReadiness: Math.min(5, (hasChecklist ? 3 : 0) + (hasReport ? 2 : 0)),
    };

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    // Generate personalized next steps
    const nextSteps: string[] = [];
    if (!hasBlueprint) nextSteps.push('Complete your business blueprint');
    if (!hasBrand) nextSteps.push('Generate your brand identity');
    if (!hasWebsite) nextSteps.push('Create your website structure');
    if (!hasMarketing) nextSteps.push('Build your marketing plan');
    if (!hasOpportunities) nextSteps.push('Identify opportunities');
    if (!completedStages.has('validation')) nextSteps.push('Validate your opportunities');
    if (!hasReport) nextSteps.push('Generate your final report');
    if (nextSteps.length === 0) nextSteps.push('Your business is ready to launch!');

    // Determine launch readiness level
    let readinessLevel = 'Not Started';
    if (totalScore >= 80) readinessLevel = 'Ready to Launch';
    else if (totalScore >= 60) readinessLevel = 'Almost There';
    else if (totalScore >= 40) readinessLevel = 'In Progress';
    else if (totalScore >= 20) readinessLevel = 'Getting Started';

    return NextResponse.json({
      score: totalScore,
      breakdown,
      readinessLevel,
      nextSteps,
      completedStages: Array.from(completedStages),
    });
  } catch (err) {
    console.error('Launch score error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
