import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getUserId(supabaseAdmin: SupabaseClient) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) return null;
  return user.id;
}

type Params = { params: Promise<{ projectId: string }> };

// GET /api/projects/[projectId]/brand - Get brand data
export async function GET(_request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('business_brand')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json({ brand: project.business_brand || null });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/brand - Generate brand identity
export async function POST(request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Build context from project data and blueprint
    const blueprint = project.business_blueprint || {};
    const context = {
      title: project.title,
      description: project.description,
      concept: blueprint.concept || '',
      problem: blueprint.problem || '',
      solution: blueprint.solution || '',
      targetMarket: blueprint.targetMarket || '',
      businessType: project.business_details?.businessType || '',
    };

    const buildFallbackBrand = () => ({
      nameIdeas: [
        `${context.title} Co.`,
        `The ${context.title} Studio`,
        `${context.title} Labs`,
        `Hello ${context.title}`,
        `${context.title} & Co.`,
      ],
      tagline: `${context.solution || context.title} — made simple, made for you.`,
      brandPersonality: ['Professional', 'Approachable', 'Innovative'],
      brandPositioning: 'A modern, customer-focused brand that stands for quality and simplicity.',
      colors: {
        primary: '#2563eb',
        secondary: '#0f172a',
        accent: '#16a34a',
        description: 'Blue for trust, dark slate for professionalism, green for growth.',
      },
      typography: {
        headingFont: 'Modern sans-serif (e.g., Inter, Poppins) for clean, bold headings',
        bodyFont: 'Readable sans-serif (e.g., Open Sans, Lato) for body text',
        description: 'Clean, modern typography that works across web and print.',
      },
      logoDirection: `A clean, minimalist wordmark or monogram that works at any size. Should be memorable and relevant to ${context.title}.`,
      brandDescription: `${context.title} is positioned as a modern, trustworthy brand that delivers ${context.solution || 'quality products and services'} to ${context.targetMarket || 'its target customers'}.`,
    });

    let brandData: Record<string, unknown>;
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'REPLACE_WITH_YOUR_OPENAI_API_KEY') {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a brand strategist. Generate a complete brand identity for this business. Return JSON only with this structure:
{
  "nameIdeas": ["name1", "name2", "name3", "name4", "name5"],
  "tagline": "string",
  "brandPersonality": ["trait1", "trait2", "trait3"],
  "brandPositioning": "string",
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "description": "string describing the color rationale"
  },
  "typography": {
    "headingFont": "font name and description",
    "bodyFont": "font name and description",
    "description": "string"
  },
  "logoDirection": "string describing the logo concept",
  "brandDescription": "2-3 sentence brand summary"
}`,
            },
            { role: 'user', content: JSON.stringify(context) },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        });

        const raw = response.choices[0]?.message?.content || '{}';
        brandData = JSON.parse(raw);
      } else {
        brandData = buildFallbackBrand();
      }
    } catch (aiError) {
      console.error('OpenAI brand generation failed, using fallback:', aiError);
      brandData = buildFallbackBrand();
    }

    // Save brand data to project
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ business_brand: brandData, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ brand: brandData });
  } catch (err) {
    console.error('Brand generation error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
