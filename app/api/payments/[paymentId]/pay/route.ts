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

type Params = { params: Promise<{ paymentId: string }> };

// POST /api/payments/[paymentId]/pay - Initiate Paystack payment
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

    const { paymentId } = await params;

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ message: 'Payment already completed' });
    }

    // Get user email for Paystack
    const { data: { user } } = await supabaseAdmin.auth.getUser();
    const userEmail = user?.email || '';
    const userMetadata = user?.user_metadata || {};

    // Initialize Paystack transaction
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      // Demo mode: mark as completed
      await supabaseAdmin
        .from('payments')
        .update({ status: 'completed', provider: 'demo', updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      return NextResponse.json({
        message: 'Payment completed (demo mode)',
        authorizationUrl: null,
      });
    }

    // Call Paystack API to initialize transaction
    const amountInKobo = Math.round(payment.amount * 100); // Paystack uses kobo (1/100 NGN)

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        amount: amountInKobo,
        currency: payment.currency,
        metadata: {
          payment_id: paymentId,
          plan: payment.plan,
          name: userMetadata.name || '',
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/${paymentId}`,
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message || 'Paystack initialization failed' }, { status: 400 });
    }

    // Update payment record with provider info
    await supabaseAdmin
      .from('payments')
      .update({
        provider: 'paystack',
        provider_transaction_id: paystackData.data.reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (err) {
    console.error('Paystack payment error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
