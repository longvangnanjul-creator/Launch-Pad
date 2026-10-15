'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ReportSection {
  number: number;
  title: string;
  content: string;
  findings?: string[];
}

interface ActionPlanItem {
  step: string;
  detail: string;
  timeframe: string;
}

interface EvidenceItem {
  id: string;
  quote_or_note: string;
  source_label: string;
}

interface Report {
  id: string;
  project_id: string;
  generated_at: string;
  sections: ReportSection[];
  actionPlan: ActionPlanItem[];
}

function ReportPageContent() {
  const params = useParams<{ projectId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    try {
      const [reportRes, evidenceRes] = await Promise.all([
        fetch(`/api/projects/${params.projectId}/report`, { cache: 'no-store' }),
        fetch(`/api/projects/${params.projectId}/evidence`, { cache: 'no-store' }),
      ]);
      const reportData = await reportRes.json().catch(() => ({}));
      const evidenceData = await evidenceRes.json().catch(() => ({}));
      if (!reportRes.ok) throw new Error(reportData.error || 'Could not load the report.');
      setReport(reportData.report);
      setEvidence(evidenceData.evidence || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the report.');
    } finally {
      setLoading(false);
    }
  }, [params.projectId]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading your report...</p></main>;
  if (error) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><div style={{ textAlign: 'center' }}><p style={{ color: '#dc2626', marginBottom: '20px' }}>{error}</p><Link href={`/workspace/${params.projectId}`} style={{ color: '#2563eb', fontWeight: 'bold' }}>Back to Workspace</Link></div></main>;
  if (!report) return null;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ padding: '20px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 23, fontWeight: 800 }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span></span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {report.sections && report.sections.length > 0 && (
            <Link href={`/workspace/${params.projectId}`} style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Back to Workspace</Link>
          )}
          <Link href="/dashboard" style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>Dashboard</Link>
        </div>
      </nav>
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px 80px' }}>
        <p style={{ margin: '0 0 10px', color: '#2563eb', textTransform: 'uppercase', fontSize: '12', letterSpacing: 1.7, fontWeight: 800 }}>Your Market Analysis Report</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-1.4px', margin: '0 0 8px' }}>Research Report</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: '36px' }}>Generated: {new Date(report.generated_at).toLocaleDateString()}</p>

        {/* Evidence Badge */}
        {evidence.length > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', marginBottom: '28px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 'bold', color: '#1d4ed8' }}>Evidence Referenced ({evidence.length} items)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {evidence.map((item) => (
                <div key={item.id} style={{ fontSize: '12px', color: '#475569' }}>
                  <span style={{ fontWeight: 600 }}>{item.source_label}:</span> {item.quote_or_note.length > 100 ? item.quote_or_note.slice(0, 100) + '...' : item.quote_or_note}
                </div>
              ))}
            </div>
          </div>
        )}

        {report.sections && report.sections.map((section) => (
          <article key={section.number} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '28px', marginBottom: 18 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>{section.number}. {section.title}</h2>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{section.content}</p>
          </article>
        ))}

        {report.actionPlan && report.actionPlan.length > 0 && (
          <article style={{ background: '#0f172a', color: '#fff', borderRadius: 14, padding: '32px', marginTop: '28px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 24 }}>Your Action Plan</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {report.actionPlan.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '16px', paddingBottom: '16px', borderBottom: index < report.actionPlan.length - 1 ? '1px solid #334155' : 'none' }}>
                  <span style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold' }}>{index + 1}</span>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: 16 }}>{item.step}</strong>
                    <span style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: '6px' }}>{item.timeframe}</span>
                    <span style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} style={{ padding: '12px 22px', border: '1px solid #cbd5e1', borderRadius: '9px', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Print Report</button>
          <Link href="/dashboard" style={{ padding: '12px 22px', borderRadius: '9px', background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: 14 }}>Back to Dashboard</Link>
        </div>
      </section>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading report...</p></div>}>
      <ReportPageContent />
    </Suspense>
  );
}
