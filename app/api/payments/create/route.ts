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

// POST /api/payments/create - Create a payment/subscription
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  }

  try {
    const userId = await getUserId(supabaseAdmin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, amount, currency } = await request.json();

    if (!plan || !amount) {
      return NextResponse.json({ error: 'Plan and amount are required.' }, { status: 400 });
    }

    // Store payment record
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        plan,
        amount,
        currency: currency || 'USD',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Integrate with payment provider (Stripe, Flutterwave, Paystack)
    // For now, return a mock payment URL
    const paymentUrl = `/payment/${payment.id}`;

    return NextResponse.json({
      payment,
      paymentUrl,
      message: 'Payment initiated. Complete payment to activate your subscription.',
    });
  } catch (err) {
    console.error('Payment creation error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
