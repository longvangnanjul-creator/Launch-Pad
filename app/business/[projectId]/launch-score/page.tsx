'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface LaunchScoreData {
  score: number;
  breakdown: {
    businessClarity: number;
    marketResearch: number;
    opportunities: number;
    branding: number;
    onlinePresence: number;
    marketing: number;
    launchReadiness: number;
  };
  readinessLevel: string;
  nextSteps: string[];
  completedStages: string[];
}

function LaunchScorePageContent() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [data, setData] = useState<LaunchScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadScore = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}/launch-score`);
      if (res.status === 401) { router.replace('/login'); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load launch score');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [params.projectId, router]);

  useEffect(() => { void loadScore(); }, [loadScore]);

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Calculating launch score...</p></main>;
  if (error) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><div style={{ textAlign: 'center' }}><p style={{ color: '#dc2626', marginBottom: '20px' }}>{error}</p><Link href={`/workspace/${params.projectId}`} style={{ color: '#2563eb', fontWeight: 'bold' }}>Back to Workspace</Link></div></main>;
  if (!data) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#2563eb';
    if (score >= 40) return '#ea580c';
    return '#dc2626';
  };

  const categories = [
    { key: 'businessClarity', label: 'Business Clarity', max: 20 },
    { key: 'marketResearch', label: 'Market Research', max: 25 },
    { key: 'opportunities', label: 'Opportunities', max: 15 },
    { key: 'branding', label: 'Branding', max: 15 },
    { key: 'onlinePresence', label: 'Online Presence', max: 10 },
    { key: 'marketing', label: 'Marketing', max: 10 },
    { key: 'launchReadiness', label: 'Launch Readiness', max: 5 },
  ];

  const getReadinessColor = () => {
    if (data.score >= 80) return '#16a34a';
    if (data.score >= 60) return '#2563eb';
    if (data.score >= 40) return '#ea580c';
    return '#dc2626';
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

      <section style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px 80px' }}>
        <p style={{ margin: '0 0 10px', color: '#2563eb', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.7, fontWeight: 800 }}>Launch Readiness</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-1.4px', margin: '0 0 8px' }}>Launch Score</h1>
        <p style={{ color: '#64748b', marginBottom: '36px' }}>See how ready your business is to launch.</p>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{error}</div>}

        {/* Score Circle */}
        <div style={{ background: '#0f172a', color: '#fff', borderRadius: '20px', padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 20px' }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="80" fill="none" stroke="#334155" strokeWidth="12" />
              <circle
                cx="90" cy="90" r="80" fill="none"
                stroke={getScoreColor(data.score)}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(data.score / 100) * 502.65} 502.65`}
                transform="rotate(-90 90 90)"
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: getScoreColor(data.score) }}>{data.score}</span>
              <span style={{ display: 'block', fontSize: '14px', color: '#94a3b8' }}>out of 100</span>
            </div>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', color: getReadinessColor() }}>{data.readinessLevel}</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Launch readiness score</p>
        </div>

        {/* Breakdown */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Score Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categories.map((cat) => {
              const value = data.breakdown[cat.key as keyof typeof data.breakdown] || 0;
              const percentage = (value / cat.max) * 100;
              return (
                <div key={cat.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600' }}>{cat.label}</span>
                    <span style={{ color: '#64748b' }}>{value}/{cat.max}</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: getScoreColor(data.score), borderRadius: '999px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Steps */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>What&apos;s Next</h3>
          {data.nextSteps.length === 0 ? (
            <p style={{ color: '#16a34a', fontWeight: 'bold' }}>Your business is ready to launch! Congratulations!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.nextSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: '14px', color: '#475569' }}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function LaunchScorePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading launch score...</p></div>}>
      <LaunchScorePageContent />
    </Suspense>
  );
}
