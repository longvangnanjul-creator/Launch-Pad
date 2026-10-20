'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DownloadPdfButton from '@/app/components/DownloadPdfButton';

interface ContentPlanItem {
  day: number;
  type: string;
  topic: string;
  caption: string;
}

interface AdConcept {
  headline: string;
  body: string;
  cta: string;
}

interface EmailCampaign {
  subject: string;
  purpose: string;
  body: string;
}

interface MarketingData {
  strategy?: string;
  targetAudience?: string;
  channels?: string[];
  contentPlan?: ContentPlanItem[];
  adConcepts?: AdConcept[];
  emailCampaigns?: EmailCampaign[];
  launchCampaign?: string;
}

function MarketingPageContent() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [marketing, setMarketing] = useState<MarketingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'ads' | 'emails' | 'launch'>('content');

  const loadMarketing = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}/marketing`);
      if (res.status === 401) { router.replace('/login'); return; }
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMarketing(data.marketing);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [params.projectId, router]);

  useEffect(() => { void loadMarketing(); }, [loadMarketing]);

  const generateMarketing = async () => {
    setError('');
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${params.projectId}/marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate marketing plan');
      setMarketing(data.marketing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading marketing...</p></main>;

  const tabs = [
    { key: 'content' as const, label: '30-Day Content Plan' },
    { key: 'ads' as const, label: 'Ad Concepts' },
    { key: 'emails' as const, label: 'Email Campaigns' },
    { key: 'launch' as const, label: 'Launch Campaign' },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav className="no-print" style={{ padding: '20px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 23, fontWeight: 800 }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span></span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/workspace/${params.projectId}`} style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Workspace</Link>
          <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
        <p style={{ margin: '0 0 10px', color: '#2563eb', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.7, fontWeight: 800 }}>Marketing</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-1.4px', margin: '0 0 8px' }}>Marketing Studio</h1>
        <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: 600, lineHeight: 1.7 }}>Generate a complete marketing plan with content strategy, ad concepts, email campaigns, and a launch campaign.</p>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{error}</div>}

        {!marketing ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>📣</div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Create Your Marketing Plan</h2>
            <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: 450, margin: '0 auto 32px', lineHeight: 1.7 }}>Let AI generate a complete marketing plan based on your business blueprint and brand identity.</p>
            <button onClick={generateMarketing} disabled={generating} style={{ padding: '14px 32px', border: 'none', borderRadius: '10px', background: generating ? '#94a3b8' : '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {generating ? 'Generating...' : 'Generate Marketing Plan →'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>Your Marketing Plan</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={generateMarketing} disabled={generating} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', color: '#0f172a', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  {generating ? 'Generating...' : 'Regenerate'}
                </button>
                <DownloadPdfButton />
              </div>
            </div>

            {/* Strategy */}
            <div style={{ background: '#0f172a', color: '#fff', borderRadius: '16px', padding: '28px' }}>
              <p style={{ margin: '0 0 8px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1.4, fontSize: '11px', fontWeight: 800 }}>Marketing Strategy</p>
              <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.8, fontSize: '16px' }}>{marketing.strategy || 'No strategy available.'}</p>
            </div>

            {/* Audience + Channels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#2563eb' }}>Target Audience</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>{marketing.targetAudience || 'No target audience specified.'}</p>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#2563eb' }}>Channels</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {marketing.channels?.map((ch, i) => (
                    <span key={i} style={{ padding: '6px 12px', borderRadius: '999px', background: '#dbeafe', color: '#1d4ed8', fontSize: '12px', fontWeight: 'bold' }}>{ch}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 18px', borderRadius: '8px', border: activeTab === tab.key ? '2px solid #2563eb' : '1px solid #cbd5e1', background: activeTab === tab.key ? '#eff6ff' : '#fff', color: activeTab === tab.key ? '#1d4ed8' : '#0f172a', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content — all panels are rendered so the PDF contains the full plan */}
            <div className="print-panel" hidden={activeTab !== 'content'} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>30-Day Content Plan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {marketing.contentPlan?.map((item) => (
                  <div key={item.day} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: '50px', textAlign: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>Day {item.day}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 'bold', background: '#dbeafe', color: '#1d4ed8' }}>{item.type}</span>
                        <strong style={{ fontSize: '14px' }}>{item.topic}</strong>
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.5 }}>{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="print-panel" hidden={activeTab !== 'ads'} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Ad Concepts</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                {marketing.adConcepts?.map((ad, i) => (
                  <div key={i} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{ad.headline}</h4>
                    <p style={{ margin: '0 0 12px', color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>{ad.body}</p>
                    <span style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', background: '#2563eb', color: '#fff' }}>{ad.cta}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="print-panel" hidden={activeTab !== 'emails'} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Email Campaigns</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {marketing.emailCampaigns?.map((email, i) => (
                  <div key={i} style={{ padding: '18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 'bold' }}>{email.subject}</h4>
                    <p style={{ margin: '0 0 6px', color: '#2563eb', fontSize: '12px', fontWeight: '600' }}>{email.purpose}</p>
                    <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>{email.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="print-panel" hidden={activeTab !== 'launch'} style={{ background: '#0f172a', color: '#fff', borderRadius: '16px', padding: '28px' }}>
              <p style={{ margin: '0 0 12px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1.4, fontSize: '11px', fontWeight: 800 }}>Launch Campaign</p>
              <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.9, fontSize: '15px' }}>{marketing.launchCampaign || 'No launch campaign available.'}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function MarketingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading marketing...</p></div>}>
      <MarketingPageContent />
    </Suspense>
  );
}
