'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  padding: '13px 14px',
  fontSize: '15px',
  color: '#0f172a',
  background: '#ffffff',
  outlineColor: '#2563eb',
}
const labelStyle = { display: 'block', fontWeight: 650, fontSize: '14px', marginBottom: '8px', color: '#1e293b' }

export default function NewBusinessPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', idea: '', product: '', customers: '', location: '', budget: '', goal: 'Validate my idea and get my first customers', businessType: 'Product or service sales' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const update = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!form.idea.trim()) {
      setError('Describe your business idea before continuing.')
      return
    }
    setSubmitting(true)
    try {
      const title = form.name.trim() || form.idea.trim().split(/[.!?\n]/)[0].slice(0, 80) || 'My new business'
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: form.idea.trim(),
          asset_type: /service/i.test(form.businessType) ? 'service' : 'idea',
          business_details: form,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 401) {
        router.replace('/login')
        return
      }
      if (!response.ok) throw new Error(data.error || 'We could not create your business. Please try again.')
      router.push(`/business/${data.project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ padding: '20px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <Link href="/dashboard" style={{ fontSize: 23, fontWeight: 800, color: '#0f172a', textDecoration: 'none' }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span></Link>
        <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>← Back to dashboard</Link>
      </nav>
      <section style={{ maxWidth: 850, margin: '0 auto', padding: '48px 20px 80px' }}>
        <p style={{ margin: '0 0 10px', color: '#2563eb', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.7, fontWeight: 800 }}>Your next chapter starts here</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-1.4px', margin: '0 0 14px' }}>Let's build your business.</h1>
        <p style={{ margin: '0 0 30px', color: '#64748b', fontSize: 17, lineHeight: 1.7, maxWidth: 670 }}>Tell us what you have in mind. LaunchKit will turn your answers into a practical starting blueprint and a checklist you can work through.</p>
        <form onSubmit={handleSubmit} style={{ padding: 'clamp(20px, 4vw, 36px)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, boxShadow: '0 12px 35px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 22 }}>
            <div><label htmlFor="business-name" style={labelStyle}>Business name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label><input id="business-name" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Fresh Basket" maxLength={100} style={inputStyle} /></div>
            <div><label htmlFor="business-type" style={labelStyle}>Business type</label><select id="business-type" value={form.businessType} onChange={e => update('businessType', e.target.value)} style={inputStyle}><option>Product or service sales</option><option>Service business</option><option>Online store / e-commerce</option><option>Digital product</option><option>Marketplace / platform</option><option>Subscription business</option><option>Not sure yet</option></select></div>
            <div style={{ gridColumn: '1 / -1' }}><label htmlFor="idea" style={labelStyle}>Describe your business idea <span style={{ color: '#dc2626' }}>*</span></label><textarea id="idea" required value={form.idea} onChange={e => update('idea', e.target.value)} placeholder="What do you want to build? What would it do, and why?" rows={4} maxLength={5000} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label htmlFor="product" style={labelStyle}>What product or service will you offer?</label><textarea id="product" value={form.product} onChange={e => update('product', e.target.value)} placeholder="Describe what customers will buy or use." rows={2} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label htmlFor="customers" style={labelStyle}>Who are your target customers?</label><textarea id="customers" value={form.customers} onChange={e => update('customers', e.target.value)} placeholder="e.g. busy parents, students, small business owners..." rows={2} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }} /></div>
            <div><label htmlFor="location" style={labelStyle}>Business location</label><input id="location" value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Lagos, Nigeria or online" maxLength={200} style={inputStyle} /></div>
            <div><label htmlFor="budget" style={labelStyle}>Available startup budget</label><input id="budget" value={form.budget} onChange={e => update('budget', e.target.value)} placeholder="e.g. ₦50,000, $100, or not sure" maxLength={200} style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label htmlFor="goal" style={labelStyle}>Your main goal</label><select id="goal" value={form.goal} onChange={e => update('goal', e.target.value)} style={inputStyle}><option>Validate my idea and get my first customers</option><option>Start earning income as soon as possible</option><option>Build a strong brand and online presence</option><option>Grow an existing business</option><option>Prepare to launch a product or service</option><option>Explore whether this idea is worth pursuing</option></select></div>
          </div>
          {error && <div role="alert" style={{ marginTop: 22, borderRadius: 10, padding: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', lineHeight: 1.5 }}>{error}</div>}
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}><button type="submit" disabled={submitting} style={{ border: 0, borderRadius: 10, padding: '14px 22px', background: submitting ? '#64748b' : '#0f172a', color: '#fff', fontSize: 15, fontWeight: 750, cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'Creating your blueprint…' : 'Create my business blueprint →'}</button><span style={{ color: '#64748b', fontSize: 13 }}>Your progress will be saved to your account.</span></div>
        </form>
      </section>
    </main>
  )
}
