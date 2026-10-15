import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// POST /api/payments/webhook - Handle Paystack webhook events
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const event = body.event;
    const data = body.data;

    console.log(`Paystack webhook: ${event}`, data?.reference);

    if (event === 'charge.success' || event === 'transfer.success') {
      const reference = data?.reference;

      if (reference) {
        // Update payment status to completed
        const { data: payment, error } = await supabaseAdmin
          .from('payments')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('provider_transaction_id', reference)
          .select()
          .single();

        if (error || !payment) {
          console.error('Failed to update payment:', error);
        } else {
          console.log(`Payment ${reference} completed for user ${payment.user_id}`);
        }
      }
    }

    if (event === 'charge.failed' || event === 'transfer.failed') {
      const reference = data?.reference;

      if (reference) {
        await supabaseAdmin
          .from('payments')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('provider_transaction_id', reference);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Paystack webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
