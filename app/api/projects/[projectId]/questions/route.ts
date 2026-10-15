import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { generateNextQuestion } from '@/lib/ai';
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

// GET /api/projects/[projectId]/questions - Get all questions and current question
export async function GET(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects').select('*').eq('id', projectId).eq('user_id', userId).single();
    if (projectError || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: questions, error } = await supabaseAdmin
      .from('question_turns').select('*').eq('project_id', projectId).order('turn_index', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Use AI to generate next question
    const nextQuestion = await generateNextQuestion(project, questions || []);

    return NextResponse.json({ questions: questions || [], currentQuestion: nextQuestion });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/questions - Submit an answer
export async function POST(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;
    const { question, answer } = await request.json();
    if (!question || !answer) return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects').select('*').eq('id', projectId).eq('user_id', userId).single();
    if (projectError || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { count } = await supabaseAdmin
      .from('question_turns').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
    const nextIndex = (count || 0) + 1;

    const { error: insertError } = await supabaseAdmin
      .from('question_turns').insert({ project_id: projectId, turn_index: nextIndex, question_text: question, answer_text: answer });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    await supabaseAdmin
      .from('projects').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', projectId);

    const { data: allQuestions } = await supabaseAdmin
      .from('question_turns').select('*').eq('project_id', projectId).order('turn_index', { ascending: true });

    // Use AI to generate next question
    const nextQuestion = await generateNextQuestion(project, allQuestions || []);

    return NextResponse.json({ success: true, nextQuestion });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
