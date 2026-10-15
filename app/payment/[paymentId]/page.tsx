'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PaymentData {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
}

function PaymentPageContent() {
  const params = useParams<{ paymentId: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPayment = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/${params.paymentId}`);
      if (res.status === 401) { router.replace('/login'); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Payment not found');
      setPayment(data.payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [params.paymentId, router]);

  useEffect(() => { void loadPayment(); }, [loadPayment]);

  const handlePay = async () => {
    if (!payment) return;
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/payments/${payment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      // Redirect to Paystack checkout
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        // Fallback: mark as completed for demo
        setPayment({ ...payment, status: 'completed' });
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading payment...</p></main>;
  if (error) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><div style={{ textAlign: 'center' }}><p style={{ color: '#dc2626', marginBottom: '20px' }}>{error}</p><Link href="/dashboard" style={{ color: '#2563eb', fontWeight: 'bold' }}>Back to Dashboard</Link></div></main>;
  if (!payment) return null;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ padding: '20px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 23, fontWeight: 800 }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span></span>
        <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Back to Dashboard</Link>
      </nav>

      <section style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 20px 80px' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>💳</div>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px' }}>Complete Payment</h1>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>Review your order and complete payment with Paystack.</p>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{error}</div>}

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#64748b' }}>Plan</span>
              <strong>{payment.plan}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#64748b' }}>Amount</span>
              <strong>{payment.currency} {payment.amount.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#64748b' }}>Status</span>
              <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', background: payment.status === 'completed' ? '#dcfce7' : '#fef3c7', color: payment.status === 'completed' ? '#16a34a' : '#92400e' }}>{payment.status.toUpperCase()}</span>
            </div>
          </div>

          {payment.status === 'completed' ? (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#16a34a' }}>Payment Successful!</h2>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Your subscription is now active.</p>
              <button onClick={() => router.push('/dashboard')} style={{ padding: '12px 24px', border: 'none', borderRadius: '9px', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Go to Dashboard →</button>
            </div>
          ) : (
            <button onClick={handlePay} disabled={processing} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '10px', background: processing ? '#94a3b8' : '#00C389', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {processing ? 'Processing...' : `Pay ${payment.currency} ${payment.amount.toFixed(2)} with Paystack`}
            </button>
          )}

          <p style={{ margin: '20px 0 0', color: '#94a3b8', fontSize: '12px' }}>Secured by Paystack. Your payment details are encrypted and secure.</p>
        </div>
      </section>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading payment...</p></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
