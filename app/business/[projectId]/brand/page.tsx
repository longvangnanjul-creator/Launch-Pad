'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface BrandData {
  nameIdeas?: string[];
  tagline?: string;
  brandPersonality?: string[];
  brandPositioning?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    description: string;
  };
  typography?: {
    headingFont: string;
    bodyFont: string;
    description: string;
  };
  logoDirection?: string;
  brandDescription?: string;
}

function BrandPageContent() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedName, setSelectedName] = useState('');

  const loadBrand = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}/brand`);
      if (res.status === 401) { router.replace('/login'); return; }
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBrand(data.brand);
        if (data.brand?.nameIdeas?.[0]) setSelectedName(data.brand.nameIdeas[0]);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [params.projectId, router]);

  useEffect(() => { void loadBrand(); }, [loadBrand]);

  const generateBrand = async () => {
    setError('');
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/brand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate brand');
      setBrand(data.brand);
      if (data.brand?.nameIdeas?.[0]) setSelectedName(data.brand.nameIdeas[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading brand...</p></main>;

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
        <p style={{ margin: '0 0 10px', color: '#2563eb', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.7, fontWeight: 800 }}>Brand Identity</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-1.4px', margin: '0 0 8px' }}>Brand Studio</h1>
        <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: 600, lineHeight: 1.7 }}>Generate a complete brand identity for your business — name ideas, tagline, colors, typography, and logo direction.</p>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{error}</div>}

        {!brand ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎨</div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Create Your Brand Identity</h2>
            <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: 450, margin: '0 auto 32px', lineHeight: 1.7 }}>Let AI generate a complete brand identity based on your business blueprint, including name ideas, tagline, colors, and typography.</p>
            <button onClick={generateBrand} disabled={generating} style={{ padding: '14px 32px', border: 'none', borderRadius: '10px', background: generating ? '#94a3b8' : '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {generating ? 'Generating...' : 'Generate Brand Identity →'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>Your Brand Identity</h2>
              <button onClick={generateBrand} disabled={generating} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', color: '#0f172a', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                {generating ? 'Generating...' : 'Regenerate'}
              </button>
            </div>

            {/* Brand Description */}
            <div style={{ background: '#0f172a', color: '#fff', borderRadius: '16px', padding: '28px' }}>
              <p style={{ margin: '0 0 8px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1.4, fontSize: '11px', fontWeight: 800 }}>Brand Summary</p>
              <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.8, fontSize: '16px' }}>{brand.brandDescription || 'No brand description available.'}</p>
            </div>

            {/* Name Ideas */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Business Name Ideas</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {brand.nameIdeas?.map((name, i) => (
                  <button key={i} onClick={() => setSelectedName(name)} style={{ padding: '10px 18px', borderRadius: '999px', border: selectedName === name ? '2px solid #2563eb' : '1px solid #cbd5e1', background: selectedName === name ? '#eff6ff' : '#fff', color: selectedName === name ? '#1d4ed8' : '#0f172a', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                    {name}
                  </button>
                ))}
              </div>
              {selectedName && <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: '13px' }}>Selected: <strong>{selectedName}</strong></p>}
            </div>

            {/* Tagline + Positioning */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#2563eb' }}>Tagline</h3>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', fontStyle: 'italic', lineHeight: 1.5 }}>{brand.tagline || 'No tagline generated.'}</p>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#2563eb' }}>Positioning</h3>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>{brand.brandPositioning || 'No positioning statement.'}</p>
              </div>
            </div>

            {/* Personality */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Brand Personality</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {brand.brandPersonality?.map((trait, i) => (
                  <span key={i} style={{ padding: '8px 16px', borderRadius: '999px', background: '#dbeafe', color: '#1d4ed8', fontSize: '13px', fontWeight: 'bold' }}>{trait}</span>
                ))}
              </div>
            </div>

            {/* Colors */}
            {brand.colors && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Brand Colors</h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Primary', color: brand.colors.primary },
                    { label: 'Secondary', color: brand.colors.secondary },
                    { label: 'Accent', color: brand.colors.accent },
                  ].map((c) => (
                    <div key={c.label} style={{ textAlign: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: c.color, border: '1px solid #e2e8f0', marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{c.label}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{c.color}</p>
                    </div>
                  ))}
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>{brand.colors.description}</p>
              </div>
            )}

            {/* Typography */}
            {brand.typography && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Typography</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Heading Font</p>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{brand.typography.headingFont}</p>
                  </div>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Body Font</p>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{brand.typography.bodyFont}</p>
                  </div>
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{brand.typography.description}</p>
              </div>
            )}

            {/* Logo Direction */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>Logo Direction</h3>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.8 }}>{brand.logoDirection || 'No logo direction available.'}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function BrandPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading brand...</p></div>}>
      <BrandPageContent />
    </Suspense>
  );
}
