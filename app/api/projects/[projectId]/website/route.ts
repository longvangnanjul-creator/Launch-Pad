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

// GET /api/projects/[projectId]/website - Get website data
export async function GET(_request: Request, { params }: Params) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('business_website')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json({ website: project.business_website || null });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/website - Generate website
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
    const context = {
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

    const buildFallbackWebsite = () => ({
      pages: [
        {
          name: 'Home',
          slug: '/',
          sections: [
            { type: 'hero', heading: context.brandName || context.title, subheading: context.tagline || context.description, body: `Welcome to ${context.brandName || context.title}. ${context.solution || context.description}` },
            { type: 'features', heading: 'What We Offer', subheading: 'Our core services and products', body: context.solution || context.description },
            { type: 'about', heading: 'About Us', subheading: 'Our story and mission', body: context.concept || context.description },
            { type: 'cta', heading: 'Get Started', subheading: 'Ready to begin?', body: `Contact us today to learn more about ${context.brandName || context.title}.` },
          ],
        },
        {
          name: 'About',
          slug: '/about',
          sections: [
            { type: 'about', heading: 'Our Story', subheading: 'How we started', body: context.concept || `${context.brandName || context.title} was founded to solve a real problem.` },
            { type: 'features', heading: 'Our Values', subheading: 'What we stand for', body: 'Quality, integrity, and customer satisfaction drive everything we do.' },
          ],
        },
        {
          name: 'Services',
          slug: '/services',
          sections: [
            { type: 'features', heading: 'Our Services', subheading: 'What we provide', body: context.solution || context.description },
            { type: 'pricing', heading: 'Pricing', subheading: 'Simple, transparent pricing', body: 'Contact us for a customized quote based on your needs.' },
          ],
        },
        {
          name: 'Contact',
          slug: '/contact',
          sections: [
            { type: 'contact', heading: 'Get In Touch', subheading: 'We would love to hear from you', body: `Reach out to ${context.brandName || context.title} for inquiries, partnerships, or support.` },
            { type: 'faq', heading: 'Frequently Asked Questions', subheading: 'Common questions answered', body: 'Find answers to the most common questions about our services.' },
          ],
        },
      ],
      colorScheme: 'Clean, modern design using the brand colors. Professional and trustworthy.',
      styleNotes: 'Modern, clean, and professional. Mobile-responsive with clear navigation and strong calls-to-action.',
    });

    let websiteData: Record<string, unknown>;
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'REPLACE_WITH_YOUR_OPENAI_API_KEY') {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a web designer and copywriter. Generate a complete website structure for this business. Return JSON only with this structure:
{
  "pages": [
    {
      "name": "Page name (e.g., Home, About, Services, Contact)",
      "slug": "url-slug",
      "sections": [
        {
          "type": "hero|features|about|testimonials|cta|contact|gallery|pricing|faq",
          "heading": "Section heading",
          "subheading": "Section subheading or description",
          "body": "Section body text"
        }
      ]
    }
  ],
  "colorScheme": "brief description of the website color scheme",
  "styleNotes": "brief description of the overall website style and feel"
}`,
            },
            { role: 'user', content: JSON.stringify(context) },
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        });

        const raw = response.choices[0]?.message?.content || '{}';
        websiteData = JSON.parse(raw);
      } else {
        websiteData = buildFallbackWebsite();
      }
    } catch (aiError) {
      console.error('OpenAI website generation failed, using fallback:', aiError);
      websiteData = buildFallbackWebsite();
    }

    // Save website data to project
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ business_website: websiteData, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ website: websiteData });
  } catch (err) {
    console.error('Website generation error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
