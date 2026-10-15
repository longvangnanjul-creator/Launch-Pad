import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      console.error('Supabase service role key is missing.')
      return NextResponse.json(
        { user: null, error: 'Supabase configuration is missing.' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !user) {
      console.error('Session verification failed:', error?.message)
      return NextResponse.json(
        { user: null, error: 'Your session is invalid or expired.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.name ?? '',
      },
    })

  } catch (error) {
    console.error('Session route error:', error)
    return NextResponse.json(
      { user: null, error: 'Unable to verify your session.' },
      { status: 500 }
    )
  }
}
