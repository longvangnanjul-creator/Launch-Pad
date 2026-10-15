'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type ChecklistItem = { id: string; title: string; description: string; completed: boolean }
type Blueprint = {
  concept?: string; problem?: string; solution?: string; targetMarket?: string; valueProposition?: string;
  businessModel?: string; startupBudget?: string; location?: string; primaryGoal?: string; nextSteps?: string[]; note?: string
}
type Project = { id: string; title: string; description: string; status: string; business_details?: Record<string, string>; business_blueprint?: Blueprint; launch_checklist?: ChecklistItem[]; created_at?: string }

const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 15, padding: 22 }
const muted = { color: '#64748b', lineHeight: 1.7, margin: 0 }

function BusinessBlueprintPage() {
  const params = useParams<{ projectId: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const loadProject = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/projects/${params.projectId}`, { cache: 'no-store' })
      if (response.status === 401) { router.replace('/login'); return }
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'We could not load this business.')
      setProject(data.project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not load this business.')
    } finally {
      setLoading(false)
    }
  }, [params.projectId, router])

  useEffect(() => { void loadProject() }, [loadProject])

  async function toggleChecklist(itemId: string) {
    if (!project || !Array.isArray(project.launch_checklist)) return
    const nextChecklist = project.launch_checklist.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
    setProject({ ...project, launch_checklist: nextChecklist })
    setSavingItem(itemId)
    setSavedMessage('')
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ launch_checklist: nextChecklist }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 401) { router.replace('/login'); return }
      if (!response.ok) throw new Error(data.error || 'Could not save checklist progress.')
      setSavedMessage('Progress saved.')
    } catch (err) {
      setProject(current => current ? { ...current, launch_checklist: project.launch_checklist } : current)
      setError(err instanceof Error ? err.message : 'Could not save checklist progress.')
    } finally { setSavingItem(null) }
  }

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}><p>Loading your business blueprint...</p></main>
  if (error && !project) return <main style={{ minHeight: '100vh', padding: 24, display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><div style={{ ...cardStyle, maxWidth: 520 }}><h1>Unable to open this business</h1><p style={muted}>{error}</p><button onClick={() => void loadProject()} style={{ marginTop: 18, padding: '12px 18px', border: 0, borderRadius: 9, background: '#0f172a', color: '#fff', cursor: 'pointer' }}>Try again</button></div></main>
  if (!project) return null

  const blueprint = project.business_blueprint || {}
  const checklist = Array.isArray(project.launch_checklist) ? project.launch_checklist : []
  const completedCount = checklist.filter(item => item.completed).length
  const sections = [
    ['Business concept', blueprint.concept], ['Problem to solve', blueprint.problem], ['Proposed solution', blueprint.solution],
    ['Target market', blueprint.targetMarket], ['Value proposition', blueprint.valueProposition], ['Suggested business model', blueprint.businessModel],
  ].filter((item): item is [string, string] => Boolean(item[1]))

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ padding: '19px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/dashboard" style={{ fontSize: 23, fontWeight: 800, color: '#0f172a', textDecoration: 'none' }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span></Link>
        <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
      </nav>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '42px 20px 80px' }}>
        <p style={{ margin: '0 0 9px', color: '#2563eb', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.5, fontWeight: 800 }}>Your business workspace</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-1.3px', overflowWrap: 'anywhere' }}>{project.title}</h1>
        <p style={{ ...muted, maxWidth: 760, fontSize: 17 }}>{project.description}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '24px 0 32px' }}>
          <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 750 }}>BUSINESS BLUEPRINT</span>
          {blueprint.primaryGoal && <span style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569', borderRadius: 999, padding: '8px 12px', fontSize: 12 }}>Goal: {blueprint.primaryGoal}</span>}
        </div>

        {error && <div role="alert" style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{error}</div>}
        {savedMessage && <p role="status" style={{ color: '#15803d', fontSize: 13, margin: '0 0 18px' }}>{savedMessage}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18, alignItems: 'start' }}>
          <section style={{ display: 'grid', gap: 16 }}>
            <div style={{ ...cardStyle, background: '#0f172a', color: '#fff', borderColor: '#0f172a' }}>
              <p style={{ margin: '0 0 9px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 11, fontWeight: 800 }}>Your starting point</p>
              <h2 style={{ margin: '0 0 12px', fontSize: 22 }}>Business snapshot</h2>
              <p style={{ margin: '0 0 16px', color: '#cbd5e1', lineHeight: 1.7 }}>{blueprint.concept || project.description}</p>
              <div style={{ display: 'grid', gap: 11, fontSize: 14 }}>
                <div><span style={{ color: '#94a3b8' }}>Budget</span><div style={{ marginTop: 3, fontWeight: 650 }}>{blueprint.startupBudget || 'Not specified yet'}</div></div>
                <div><span style={{ color: '#94a3b8' }}>Location</span><div style={{ marginTop: 3, fontWeight: 650 }}>{blueprint.location || 'Not specified yet'}</div></div>
              </div>
            </div>
            {sections.length > 0 ? sections.map(([title, content]) => <article key={title} style={cardStyle}><h2 style={{ margin: '0 0 10px', fontSize: 18 }}>{title}</h2><p style={muted}>{content}</p></article>) : <article style={cardStyle}><h2 style={{ margin: '0 0 10px', fontSize: 18 }}>Your idea</h2><p style={muted}>{project.description}</p><p style={{ ...muted, marginTop: 12 }}>This is an existing project. New businesses created through the Business Creation form will also include a generated blueprint.</p></article>}
            {blueprint.nextSteps && blueprint.nextSteps.length > 0 && <article style={cardStyle}><h2 style={{ margin: '0 0 14px', fontSize: 18 }}>Recommended next steps</h2><ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 12, color: '#475569', lineHeight: 1.6 }}>{blueprint.nextSteps.map((step, index) => <li key={index}>{step}</li>)}</ol></article>}
          </section>

          <aside style={{ ...cardStyle, position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}><div><p style={{ margin: '0 0 7px', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, fontWeight: 800 }}>Action plan</p><h2 style={{ margin: 0, fontSize: 22 }}>Launch checklist</h2></div><span style={{ background: '#f1f5f9', borderRadius: 10, padding: '8px 10px', fontSize: 13, fontWeight: 800 }}>{completedCount}/{checklist.length}</span></div>
            {checklist.length > 0 ? <>
              <div style={{ height: 7, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', margin: '18px 0 22px' }}><div style={{ width: `${(completedCount / checklist.length) * 100}%`, height: '100%', background: '#2563eb', transition: 'width 180ms ease' }} /></div>
              <div style={{ display: 'grid', gap: 0 }}>{checklist.map((item, index) => <label key={item.id} style={{ display: 'flex', gap: 12, padding: '15px 0', borderTop: index === 0 ? '0' : '1px solid #f1f5f9', cursor: 'pointer', opacity: item.completed ? 0.7 : 1 }}><input type="checkbox" checked={item.completed} disabled={savingItem !== null} onChange={() => void toggleChecklist(item.id)} style={{ marginTop: 4, width: 17, height: 17, accentColor: '#2563eb', flexShrink: 0 }} /><span><strong style={{ display: 'block', fontSize: 14, lineHeight: 1.5, textDecoration: item.completed ? 'line-through' : 'none' }}>{item.title}</strong><span style={{ display: 'block', marginTop: 5, color: '#64748b', fontSize: 12, lineHeight: 1.6 }}>{item.description}</span>{savingItem === item.id && <span style={{ display: 'block', marginTop: 5, color: '#2563eb', fontSize: 11 }}>Saving...</span>}</span></label>)}</div>
            </> : <p style={{ ...muted, marginTop: 18 }}>This project does not have a checklist yet. Create a new business to generate a launch checklist.</p>}
            {blueprint.note && <p style={{ borderTop: '1px solid #e2e8f0', paddingTop: 15, margin: '14px 0 0', color: '#94a3b8', fontSize: 11, lineHeight: 1.6 }}>{blueprint.note}</p>}
          </aside>
        </div>
      </section>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading...</p></div>}>
      <BusinessBlueprintPage />
    </Suspense>
  );
}
