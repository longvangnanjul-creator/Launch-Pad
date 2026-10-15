'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface WebsiteSection {
  type: string;
  heading: string;
  subheading: string;
  body: string;
}

interface WebsitePage {
  name: string;
  slug: string;
  sections: WebsiteSection[];
}

interface WebsiteData {
  pages?: WebsitePage[];
  colorScheme?: string;
  styleNotes?: string;
}

function WebsitePageContent() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState(0);

  const loadWebsite = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}/website`);
      if (res.status === 401) { router.replace('/login'); return; }
      const data = await res.json().catch(() => ({}));
      if (res.ok) setWebsite(data.website);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [params.projectId, router]);

  useEffect(() => { void loadWebsite(); }, [loadWebsite]);

  const generateWebsite = async () => {
    setError('');
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate website');
      setWebsite(data.website);
      setActivePage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading website...</p></main>;

  const sectionTypeIcons: Record<string, string> = {
    hero: '🏠', features: '✨', about: '👋', testimonials: '💬', cta: '📣', contact: '📧', gallery: '🖼️', pricing: '💰', faq: '❓',
  };

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
        <p style={{ margin: '0 0 10px', color: '#2563eb', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.7, fontWeight: 800 }}>Website Builder</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-1.4px', margin: '0 0 8px' }}>Website Studio</h1>
        <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: 600, lineHeight: 1.7 }}>Generate a complete website structure with pages, sections, and copy for your business.</p>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{error}</div>}

        {!website ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>🌐</div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Create Your Website</h2>
            <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: 450, margin: '0 auto 32px', lineHeight: 1.7 }}>Let AI generate a complete website structure based on your business blueprint and brand identity.</p>
            <button onClick={generateWebsite} disabled={generating} style={{ padding: '14px 32px', border: 'none', borderRadius: '10px', background: generating ? '#94a3b8' : '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {generating ? 'Generating...' : 'Generate Website →'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>Your Website Structure</h2>
              <button onClick={generateWebsite} disabled={generating} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', color: '#0f172a', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                {generating ? 'Generating...' : 'Regenerate'}
              </button>
            </div>

            {/* Style Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#2563eb' }}>Color Scheme</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>{website.colorScheme || 'No color scheme specified.'}</p>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#2563eb' }}>Style Notes</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>{website.styleNotes || 'No style notes.'}</p>
              </div>
            </div>

            {/* Page Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {website.pages?.map((page, i) => (
                <button key={i} onClick={() => setActivePage(i)} style={{ padding: '8px 16px', borderRadius: '8px', border: activePage === i ? '2px solid #2563eb' : '1px solid #cbd5e1', background: activePage === i ? '#eff6ff' : '#fff', color: activePage === i ? '#1d4ed8' : '#0f172a', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                  {page.name}
                </button>
              ))}
            </div>

            {/* Active Page */}
            {website.pages?.[activePage] && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>{website.pages[activePage].name}</h3>
                  <span style={{ padding: '4px 10px', borderRadius: '999px', background: '#f1f5f9', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>{website.pages[activePage].slug}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {website.pages[activePage].sections.map((section, i) => (
                    <div key={i} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{sectionTypeIcons[section.type] || '📄'}</span>
                        <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 'bold', background: '#dbeafe', color: '#1d4ed8', textTransform: 'uppercase' }}>{section.type}</span>
                      </div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 'bold' }}>{section.heading}</h4>
                      <p style={{ margin: '0 0 8px', color: '#2563eb', fontSize: '14px', fontWeight: '600' }}>{section.subheading}</p>
                      <p style={{ margin: 0, color: '#475569', lineHeight: 1.7, fontSize: '14px' }}>{section.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function WebsitePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading website...</p></div>}>
      <WebsitePageContent />
    </Suspense>
  );
}
