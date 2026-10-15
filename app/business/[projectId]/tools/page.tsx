'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ToolsData {
  invoiceTemplate?: string;
  proposalTemplate?: string;
  businessPlanOutline?: string;
}

function ToolsPageContent() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [tools, setTools] = useState<ToolsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Invoice state
  const [invoiceFields, setInvoiceFields] = useState({
    businessName: '',
    clientName: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    taxRate: 0,
    notes: '',
  });

  // Proposal state
  const [proposalFields, setProposalFields] = useState({
    title: '',
    clientName: '',
    problem: '',
    solution: '',
    timeline: '',
    pricing: '',
  });

  // Pricing calculator state
  const [pricing, setPricing] = useState({
    costPerUnit: 0,
    profitMargin: 50,
    overhead: 0,
  });

  // Service request state
  const [serviceType, setServiceType] = useState('Logo Design');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceBudget, setServiceBudget] = useState('');
  const [serviceTimeline, setServiceTimeline] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const loadTools = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}/tools`);
      if (res.status === 401) { router.replace('/login'); return; }
      const data = await res.json().catch(() => ({}));
      if (res.ok) setTools(data.tools);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [params.projectId, router]);

  useEffect(() => { void loadTools(); }, [loadTools]);

  const saveTools = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${params.projectId}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceTemplate: 'saved', proposalTemplate: 'saved' }),
      });
      if (!res.ok) throw new Error('Failed to save tools');
      setMessage('Tools saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceFields((prev) => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, rate: 0 }] }));
  };

  const updateInvoiceItem = (index: number, field: string, value: string | number) => {
    setInvoiceFields((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceFields((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const calculateInvoiceTotal = () => {
    const subtotal = invoiceFields.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const tax = subtotal * (invoiceFields.taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  };

  const calculatePrice = () => {
    const cost = pricing.costPerUnit + pricing.overhead;
    const price = cost / (1 - pricing.profitMargin / 100);
    return { cost, price, profit: price - cost };
  };

  const submitServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceDescription.trim()) {
      setError('Please describe what you need.');
      return;
    }
    setSubmittingRequest(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${params.projectId}/service-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType, description: serviceDescription, budget: serviceBudget, timeline: serviceTimeline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      setMessage('Service request submitted! Our team will review it and connect you with an expert.');
      setServiceDescription('');
      setServiceBudget('');
      setServiceTimeline('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading tools...</p></main>;

  const totals = calculateInvoiceTotal();
  const priceResult = calculatePrice();

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ padding: '20px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 23, fontWeight: 800 }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span></span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/workspace/${params.projectId}`} style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Workspace</Link>
          <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
        <p style={{ margin: '0 0 10px', color: '#2563eb', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.7, fontWeight: 800 }}>Business Tools</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-1.4px', margin: '0 0 8px' }}>Tools & Services</h1>
        <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: 600, lineHeight: 1.7 }}>Business tools, templates, calculators, and expert services to help you launch.</p>

        {message && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{message}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '20px' }}>
          {/* Invoice Generator */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>Invoice Generator</h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>Create professional invoices for your business.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Your Business</label>
                <input type="text" value={invoiceFields.businessName} onChange={(e) => setInvoiceFields({ ...invoiceFields, businessName: e.target.value })} placeholder="Business name" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Client Name</label>
                <input type="text" value={invoiceFields.clientName} onChange={(e) => setInvoiceFields({ ...invoiceFields, clientName: e.target.value })} placeholder="Client name" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Line Items</label>
              {invoiceFields.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input type="text" value={item.description} onChange={(e) => updateInvoiceItem(i, 'description', e.target.value)} placeholder="Description" style={{ flex: 2, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
                  <input type="number" value={item.quantity} onChange={(e) => updateInvoiceItem(i, 'quantity', Number(e.target.value))} placeholder="Qty" style={{ width: '60px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
                  <input type="number" value={item.rate} onChange={(e) => updateInvoiceItem(i, 'rate', Number(e.target.value))} placeholder="Rate" style={{ width: '80px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
                  <button onClick={() => removeInvoiceItem(i)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>×</button>
                </div>
              ))}
              <button onClick={addInvoiceItem} style={{ padding: '6px 12px', border: '1px dashed #cbd5e1', borderRadius: '6px', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#2563eb', fontWeight: 'bold' }}>+ Add Item</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tax Rate (%)</label>
              <input type="number" value={invoiceFields.taxRate} onChange={(e) => setInvoiceFields({ ...invoiceFields, taxRate: Number(e.target.value) })} style={{ width: '100px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span>Subtotal</span><span>{totals.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span>Tax ({invoiceFields.taxRate}%)</span><span>{totals.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <span>Total</span><span>{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Pricing Calculator */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>Pricing Calculator</h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>Calculate the right price for your product or service.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Cost Per Unit</label>
                <input type="number" value={pricing.costPerUnit} onChange={(e) => setPricing({ ...pricing, costPerUnit: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Overhead Costs</label>
                <input type="number" value={pricing.overhead} onChange={(e) => setPricing({ ...pricing, overhead: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Profit Margin (%)</label>
                <input type="number" value={pricing.profitMargin} onChange={(e) => setPricing({ ...pricing, profitMargin: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span>Total Cost</span><span>{priceResult.cost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span>Profit</span><span>{priceResult.profit.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid #bbf7d0', paddingTop: '8px', color: '#16a34a' }}>
                <span>Recommended Price</span><span>{priceResult.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Service Request */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', gridColumn: '1 / -1' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>Request Expert Help</h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>Can&apos;t do it yourself? Request help from a professional expert.</p>

            <form onSubmit={submitServiceRequest}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>What do you need?</label>
                <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', background: '#fff' }}>
                  <option>Logo Design</option>
                  <option>Website Design</option>
                  <option>Brand Identity</option>
                  <option>Marketing Strategy</option>
                  <option>Content Writing</option>
                  <option>Video Editing</option>
                  <option>Business Registration</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Describe what you need</label>
                <textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} rows={4} placeholder="Describe the service you need in detail..." required style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Budget (optional)</label>
                  <input type="text" value={serviceBudget} onChange={(e) => setServiceBudget(e.target.value)} placeholder="e.g. $500" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Timeline (optional)</label>
                  <input type="text" value={serviceTimeline} onChange={(e) => setServiceTimeline(e.target.value)} placeholder="e.g. 2 weeks" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
                </div>
              </div>
              <button type="submit" disabled={submittingRequest || !serviceDescription.trim()} style={{ padding: '12px 24px', border: 'none', borderRadius: '9px', background: submittingRequest ? '#94a3b8' : '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                {submittingRequest ? 'Submitting...' : 'Submit Service Request →'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading tools...</p></div>}>
      <ToolsPageContent />
    </Suspense>
  );
}
