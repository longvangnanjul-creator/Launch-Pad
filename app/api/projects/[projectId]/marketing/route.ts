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

// GET /api/projects/[projectId]/marketing - Get marketing data
export async function GET(_request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('business_marketing')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json({ marketing: project.business_marketing || null });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

function buildFallbackMarketing(context: Record<string, unknown>) {
  const name = (context.brandName as string) || (context.title as string);
  const target = (context.targetMarket as string) || 'your target customers';
  const solution = (context.solution as string) || (context.description as string);
  const tagline = (context.tagline as string) || solution;

  return {
    strategy: `${name} will use a multi-channel marketing approach focused on building awareness, generating leads, and converting customers through valuable content and strategic advertising.`,
    targetAudience: `Primary audience: ${target}. Reach them through social media, content marketing, and targeted advertising.`,
    channels: ['Instagram', 'Facebook', 'Google Ads', 'Email Marketing', 'Content Marketing'],
    contentPlan: [
      { day: 1, type: 'Introduction', topic: `Introducing ${name}`, caption: `Meet ${name} — ${tagline}` },
      { day: 2, type: 'Problem Awareness', topic: 'The problem we solve', caption: `Did you know? ${(context.problem as string) || 'Many people struggle with this every day.'}` },
      { day: 3, type: 'Educational', topic: 'Tips and insights', caption: `Here's a quick tip that could make a big difference for ${target}.` },
      { day: 4, type: 'Product Benefit', topic: 'Key benefit', caption: `Discover how ${name} can help you achieve more with less effort.` },
      { day: 5, type: 'Customer Problem', topic: 'Real pain point', caption: `We understand the frustration. That's why we built ${name}.` },
      { day: 6, type: 'Behind the Scenes', topic: 'Our story', caption: `Ever wondered what goes into making ${name}? Here's a peek behind the scenes.` },
      { day: 7, type: 'Social Proof', topic: 'Testimonial Tuesday', caption: `Don't just take our word for it — here's what others are saying.` },
      { day: 8, type: 'Educational', topic: 'How-to guide', caption: `Step-by-step guide: Get the most out of ${name}.` },
      { day: 9, type: 'Engagement', topic: 'Poll or question', caption: `We want to hear from you! What's your biggest challenge?` },
      { day: 10, type: 'Product Feature', topic: 'Feature highlight', caption: `Feature spotlight: Here's what makes ${name} different.` },
      { day: 14, type: 'Case Study', topic: 'Success story', caption: `See how ${name} helped someone just like you achieve their goals.` },
      { day: 21, type: 'Promotion', topic: 'Special offer', caption: `Limited time offer: Get started with ${name} today!` },
      { day: 30, type: 'Launch', topic: 'Launch announcement', caption: `The wait is over! ${name} is officially here. Join us today!` },
    ],
    adConcepts: [
      { headline: `Introducing ${name}`, body: `${tagline}. The smarter way to get results.`, cta: 'Learn More' },
      { headline: 'Tired of the old way?', body: `${name} makes it easier, faster, and better. See the difference for yourself.`, cta: 'Try It Now' },
      { headline: `Join ${target} who trust ${name}`, body: `Discover why ${name} is the choice for people who demand quality.`, cta: 'Get Started' },
    ],
    emailCampaigns: [
      { subject: `Welcome to ${name}!`, purpose: 'Welcome new subscribers and introduce the brand', body: 'Welcome email with brand story, value proposition, and first call to action.' },
      { subject: 'Your exclusive offer inside', purpose: 'Nurture leads with a special offer or discount', body: 'Promotional email with limited-time offer, urgency, and clear CTA.' },
      { subject: `Tips to get the most from ${name}`, purpose: 'Provide value and keep the brand top-of-mind', body: 'Educational email with tips, best practices, and product usage advice.' },
      { subject: "We miss you — here's 20% off", purpose: 'Re-engage inactive subscribers or customers', body: 'Win-back email with special discount and reminder of the value proposition.' },
    ],
    launchCampaign: `A 2-week launch campaign for ${name}: Week 1 — Tease the launch on social media with behind-the-scenes content and waitlist signup. Week 2 — Announce the launch with a special offer, coordinate across all channels, run a launch event or webinar, and follow up with email marketing. Leverage the 30-day content plan to maintain momentum post-launch.`,
  };
}

// POST /api/projects/[projectId]/marketing - Generate marketing plan
export async function POST(_request: Request, { params }: Params) {
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

    // Build context from project data, blueprint, and brand
    const blueprint = project.business_blueprint || {};
    const brand = project.business_brand || {};
    const context: Record<string, unknown> = {
      title: project.title,
      description: project.description,
      concept: blueprint.concept || '',
      problem: blueprint.problem || '',
      solution: blueprint.solution || '',
      targetMarket: blueprint.targetMarket || '',
      valueProposition: blueprint.valueProposition || '',
      businessModel: blueprint.businessModel || '',
      brandName: brand.nameIdeas?.[0] || project.title,
      tagline: brand.tagline || '',
      brandPersonality: brand.brandPersonality || [],
      businessType: project.business_details?.businessType || '',
    };

    let marketingData: Record<string, unknown>;
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'REPLACE_WITH_YOUR_OPENAI_API_KEY') {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a marketing strategist. Generate a complete marketing plan for this business. Return JSON only with this structure:
{
  "strategy": "string — overall marketing strategy summary",
  "targetAudience": "string — who to reach and where",
  "channels": ["channel1", "channel2", "channel3"],
  "contentPlan": [
    { "day": 1, "type": "content type", "topic": "post topic", "caption": "social media caption" }
  ],
  "adConcepts": [
    { "headline": "ad headline", "body": "ad body copy", "cta": "call to action" }
  ],
  "emailCampaigns": [
    { "subject": "email subject", "purpose": "what this email achieves", "body": "email body outline" }
  ],
  "launchCampaign": "string describing the launch campaign approach"
}`,
            },
            { role: 'user', content: JSON.stringify(context) },
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        });

        const raw = response.choices[0]?.message?.content || '{}';
        marketingData = JSON.parse(raw);
      } else {
        marketingData = buildFallbackMarketing(context);
      }
    } catch (aiError) {
      console.error('OpenAI marketing generation failed, using fallback:', aiError);
      marketingData = buildFallbackMarketing(context);
    }

    // Save marketing data to project
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ business_marketing: marketingData, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ marketing: marketingData });
  } catch (err) {
    console.error('Marketing generation error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
