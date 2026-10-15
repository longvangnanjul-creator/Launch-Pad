import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

async function getUserId(supabaseAdmin: SupabaseClient) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  if (!accessToken) return null

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
  if (error || !user) return null
  return user.id
}

const launchChecklistTemplate = [
  { id: 'validate', title: 'Validate the business idea', description: 'Speak with potential customers and confirm that the problem matters.', completed: false },
  { id: 'name-brand', title: 'Choose a business name and brand direction', description: 'Choose a memorable name, colours, and a clear message.', completed: false },
  { id: 'logo', title: 'Create a logo and visual identity', description: 'Prepare a simple logo and consistent visual assets.', completed: false },
  { id: 'offer', title: 'Define your offer and pricing', description: 'Write down what you sell, what it includes, and how much it costs.', completed: false },
  { id: 'website', title: 'Prepare a website or landing page', description: 'Give customers a clear place to understand your offer and contact you.', completed: false },
  { id: 'marketing', title: 'Plan your first marketing campaign', description: 'Choose one or two channels and prepare useful launch content.', completed: false },
  { id: 'social', title: 'Set up your social media presence', description: 'Create or update profiles where your target customers spend time.', completed: false },
  { id: 'launch', title: 'Prepare and announce your launch', description: 'Set a launch date, check your customer journey, and tell people about it.', completed: false },
]

function buildBlueprint(details: Record<string, string>) {
  const name = details.name?.trim() || 'Your business'
  const idea = details.idea.trim()
  const product = details.product?.trim() || 'the product or service described in your idea'
  const customers = details.customers?.trim() || 'customers who experience the problem your business aims to solve'
  const goal = details.goal?.trim() || 'validate the idea and win the first paying customers'
  const type = details.businessType?.trim() || 'a business model that best fits the customer and offer'

  return {
    concept: `${name} will focus on ${idea.charAt(0).toLowerCase() + idea.slice(1)}. Its initial offer is ${product}.`,
    problem: `Investigate the most important and frequent difficulty experienced by ${customers}. Interview potential customers before investing heavily.`,
    solution: `Offer ${product} in a simple, reliable way that directly addresses the customer problem. Start with a small version of the offer and improve it using customer feedback.`,
    targetMarket: customers,
    valueProposition: `Help ${customers} solve a meaningful problem with a clear, convenient offer and a trustworthy customer experience.`,
    businessModel: `Begin with ${type}. Test a straightforward pricing approach, track costs, and confirm customers are willing to pay before scaling.`,
    startupBudget: details.budget?.trim() || 'Not specified yet',
    location: details.location?.trim() || 'Not specified yet',
    primaryGoal: goal,
    nextSteps: [
      'Talk to at least five people who match your target customer profile.',
      'Write down the exact problem, current alternatives, and what customers dislike about them.',
      'Create a small first offer and estimate its delivery cost and price.',
      'Show the offer to potential customers and record their feedback.',
      'Use the launch checklist to prepare your brand, online presence, and launch.',
    ],
    note: 'This is a practical starting blueprint generated from your answers, not a substitute for customer research or professional legal, tax, or financial advice.',
  }
}

// GET /api/projects — list the signed-in user's projects.
export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 })

  try {
    const userId = await getUserId(supabaseAdmin)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: projects, error } = await supabaseAdmin
      .from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ projects: projects || [] })
  } catch {
    return NextResponse.json({ error: 'Something went wrong while loading projects.' }, { status: 500 })
  }
}

// POST /api/projects — create a project or a full business starter blueprint.
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 })

  try {
    const userId = await getUserId(supabaseAdmin)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Please submit valid form details.' }, { status: 400 })

    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : ''
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 5000) : ''
    const assetType = typeof body.asset_type === 'string' ? body.asset_type : 'idea'
    const isBusinessCreation = body.business_details && typeof body.business_details === 'object'
    const details = isBusinessCreation ? body.business_details as Record<string, unknown> : null

    if (!title || !description) {
      return NextResponse.json({ error: 'A business name and business idea are required.' }, { status: 400 })
    }

    const validAssetTypes = ['idea', 'skill', 'product', 'service', 'existing_business', 'none', 'industry']
    const safeAssetType = validAssetTypes.includes(assetType) ? assetType : 'idea'
    let insertData: Record<string, unknown> = {
      user_id: userId,
      title,
      description,
      asset_type: safeAssetType,
      objective: 'validate_idea',
      current_stage: 'onboarding',
      status: 'draft',
    }

    if (details) {
      const cleanDetails: Record<string, string> = {}
      for (const key of ['name', 'idea', 'product', 'customers', 'location', 'budget', 'goal', 'businessType']) {
        const value = details[key]
        if (typeof value === 'string') cleanDetails[key] = value.trim().slice(0, 2000)
      }
      if (!cleanDetails.idea) return NextResponse.json({ error: 'Please describe your business idea.' }, { status: 400 })

      const blueprint = buildBlueprint(cleanDetails)
      insertData = {
        ...insertData,
        business_details: cleanDetails,
        business_blueprint: blueprint,
        launch_checklist: launchChecklistTemplate,
      }
    }

    const { data: project, error } = await supabaseAdmin.from('projects').insert(insertData).select().single()

    if (error) {
      if (details && /business_details|business_blueprint|launch_checklist|column/i.test(error.message)) {
        return NextResponse.json({ error: 'The database needs the Business Creation update. Apply supabase/migrations/002_business_creation.sql in your Supabase SQL Editor, then try again.' }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong while creating your business.' }, { status: 500 })
  }
}
