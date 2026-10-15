import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email =
      typeof body.email === 'string' ? body.email.trim() : ''
    const password =
      typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing.')

      return NextResponse.json(
        { error: 'The authentication service is not configured correctly.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Login succeeded without a valid session. Please try again.' },
        { status: 401 }
      )
    }

    const cookieStore = await cookies()

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }

    cookieStore.set(
      'sb-access-token',
      data.session.access_token,
      cookieOptions
    )

    cookieStore.set(
      'sb-refresh-token',
      data.session.refresh_token,
      cookieOptions
    )

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.name ?? '',
      },
    })
  } catch (error) {
    console.error('Sign-in API error:', error)

    return NextResponse.json(
      { error: 'Unable to sign in right now. Please try again.' },
      { status: 500 }
    )
  }
}
