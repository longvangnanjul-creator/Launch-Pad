'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface QuestionTurn {
  id: string;
  turn_index: number;
  question_text: string;
  answer_text: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  current_stage: string;
  status: string;
  asset_type: string;
}

interface Finding {
  id: string;
  stage: string;
  kind: string;
  text: string;
  gap_type: string | null;
}

interface Opportunity {
  id: string;
  name: string;
  customer: string;
  problem: string;
  proposed_solution: string;
  why_it_exists: string;
  alternatives: string;
  differentiation: string;
  required_skills: string;
  business_model: string;
  risks: string;
  validation_steps: string;
  demand_evidence: string;
  demand_evidence_kind: string;
  problem_severity: string;
  competition: string;
  market_gap: string;
  market_gap_kind: string;
  monetization: string;
  skills: string;
  main_risks: string;
  evidence_strength: string;
}

const STAGES = [
  { key: 'onboarding', label: 'Getting Started' },
  { key: 'questioning', label: 'AI Questions' },
  { key: 'customer', label: 'Customer Analysis' },
  { key: 'problem', label: 'Problem Analysis' },
  { key: 'demand', label: 'Demand Analysis' },
  { key: 'competitors', label: 'Competitor Analysis' },
  { key: 'gaps', label: 'Market Gaps' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'validation', label: 'Validation' },
  { key: 'report', label: 'Report' },
];

const ANALYSIS_STAGES = ['customer', 'problem', 'demand', 'competitors', 'gaps', 'opportunities', 'validation'];

export default function Workspace() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading workspace...</p></div>}>
      <WorkspaceContent />
    </Suspense>
  );
}

function WorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<QuestionTurn[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [runningStage, setRunningStage] = useState('');
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [showAddOpp, setShowAddOpp] = useState(false);
  const [newOppName, setNewOppName] = useState('');
  const [savingOpp, setSavingOpp] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (data.project) setProject(data.project);
    } catch { /* ignore */ }
  }, [projectId, router]);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/questions`);
      if (!res.ok) return;
      const data = await res.json();
      setQuestions(data.questions || []);
      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
    } catch { /* ignore */ }
  }, [projectId]);

  const loadFindings = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stages`);
      if (!res.ok) return;
      const data = await res.json();
      setFindings(data.findings || []);
    } catch { /* ignore */ }
  }, [projectId]);

  const loadOpportunities = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/opportunities`);
      if (!res.ok) return;
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch { /* ignore */ }
  }, [projectId]);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadProject(), loadQuestions(), loadFindings(), loadOpportunities()]);
  }, [loadProject, loadQuestions, loadFindings, loadOpportunities]);

  useEffect(() => {
    Promise.all([loadProject(), loadQuestions(), loadFindings(), loadOpportunities()]).finally(() => setLoading(false));
  }, [loadProject, loadQuestions, loadFindings, loadOpportunities]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion, answer: answer.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit answer'); return; }
      setAnswer('');
      if (data.nextQuestion) setCurrentQuestion(data.nextQuestion);
      else setCurrentQuestion('');
      await reloadAll();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const runStage = async (stage: string) => {
    setError('');
    setRunningStage(stage);
    try {
      const res = await fetch(`/api/projects/${projectId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Failed to run ${stage} analysis`); return; }
      await reloadAll();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setRunningStage('');
    }
  };

  const openOppEditor = (opp: Opportunity) => {
    setEditingOpp(opp);
  };

  const handleSaveOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;
    setSavingOpp(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/opportunities/${editingOpp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOpp),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update opportunity'); return; }
      setEditingOpp(null);
      await loadOpportunities();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSavingOpp(false);
    }
  };

  const handleDeleteOpp = async (oppId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this opportunity?');
    if (!confirmed) return;
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/opportunities/${oppId}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Failed to delete'); return; }
      await loadOpportunities();
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleAddOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppName.trim()) return;
    setSavingOpp(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/opportunities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOppName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to add opportunity'); return; }
      setNewOppName('');
      setShowAddOpp(false);
      await loadOpportunities();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSavingOpp(false);
    }
  };

  const openEditModal = () => {
    setEditTitle(project?.title || '');
    setEditDescription(project?.description || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update project'); return; }
      setShowEditModal(false);
      await loadProject();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const generateReport = async () => {
    setError('');
    setRunningStage('report');
    try {
      const res = await fetch(`/api/projects/${projectId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to generate report'); return; }
      await loadProject();
      router.push(`/report/${projectId}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setRunningStage('');
    }
  };

  const getStageIndex = (stageKey: string) => STAGES.findIndex((s) => s.key === stageKey);

  const getNextAnalysisStage = () => {
    const currentIdx = getStageIndex(project?.current_stage || 'onboarding');
    for (let i = currentIdx + 1; i < STAGES.length; i++) {
      if (ANALYSIS_STAGES.includes(STAGES[i].key)) return STAGES[i].key;
    }
    return null;
  };

  if (loading) return <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading workspace...</p></main>;
  if (!project) return <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'Arial, sans-serif' }}><div style={{ textAlign: 'center' }}><p style={{ color: '#64748b', marginBottom: '20px' }}>Project not found</p><Link href="/dashboard" style={{ color: '#2563eb', fontWeight: 'bold' }}>Back to Dashboard</Link></div></main>;

  const currentStageIndex = getStageIndex(project.current_stage);
  const nextAnalysisStage = getNextAnalysisStage();
  const stageFindings = findings.filter((f) => f.stage === project.current_stage);
  const stageOpportunities = opportunities.filter((o) => {
    const oppFindings = findings.filter((f) => f.stage === 'opportunities');
    return oppFindings.length > 0 || opportunities.length > 0;
  });
  const allAnalysisComplete = project.current_stage === 'report' || (project.current_stage === 'validation' && stageFindings.length > 0);

  return (
    <main style={{ height: '100vh', background: '#f8fafc', fontFamily: 'Arial, sans-serif', color: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Back</button>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span></span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>{project.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={`/business/${projectId}/brand`} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>Brand</Link>
          <Link href={`/business/${projectId}/website`} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>Website</Link>
          <Link href={`/business/${projectId}/marketing`} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>Marketing</Link>
          <Link href={`/business/${projectId}/launch-score`} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>Launch Score</Link>
          <Link href={`/business/${projectId}/tools`} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>Tools</Link>
          <button onClick={openEditModal} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Edit</button>
          {project.status === 'completed' && (
            <Link href={`/report/${projectId}`} style={{ padding: '9px 18px', borderRadius: '8px', background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>View Report</Link>
          )}
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Stages */}
        <div style={{ width: '240px', minWidth: '240px', background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '20px 12px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', padding: '0 8px' }}>Research Stages</h3>
          {STAGES.map((stage, index) => {
            const isActive = stage.key === project.current_stage;
            const isCompleted = index < currentStageIndex;
            const stageHasFindings = findings.some((f) => f.stage === stage.key);
            const stageHasOpportunities = opportunities.length > 0 && stage.key === 'opportunities';
            const isStageComplete = isCompleted || stageHasFindings || stageHasOpportunities;
            return (
              <div key={stage.key} style={{ padding: '9px 10px', borderRadius: '8px', marginBottom: '3px', background: isActive ? '#eff6ff' : 'transparent', borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold',
                    background: isStageComplete ? '#16a34a' : isActive ? '#2563eb' : '#e2e8f0',
                    color: isStageComplete || isActive ? '#ffffff' : '#64748b', flexShrink: 0,
                  }}>
                    {isStageComplete ? '✓' : index + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: isActive ? '600' : '400', color: isActive ? '#1d4ed8' : isStageComplete ? '#16a34a' : '#64748b' }}>{stage.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Panel */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {project.current_stage === 'questioning' ? 'AI Question' : `Stage: ${STAGES[currentStageIndex]?.label || project.current_stage}`}
              </span>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

            {/* Question Input */}
            {currentQuestion ? (
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.4' }}>{currentQuestion}</h2>
                <form onSubmit={handleSubmitAnswer}>
                  <textarea placeholder="Type your answer here..." value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} style={{ width: '100%', padding: '14px', border: '1px solid #94a3b8', borderRadius: '10px', boxSizing: 'border-box', fontSize: '15px', resize: 'vertical', marginBottom: '18px', fontFamily: 'inherit' }} />
                  <button type="submit" disabled={submitting || !answer.trim()} style={{ padding: '12px 28px', border: 'none', borderRadius: '10px', background: submitting || !answer.trim() ? '#94a3b8' : '#0f172a', color: '#ffffff', cursor: submitting || !answer.trim() ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                    {submitting ? 'Submitting...' : 'Submit Answer →'}
                  </button>
                </form>
              </div>
            ) : !currentQuestion && nextAnalysisStage && project.current_stage !== 'report' && !allAnalysisComplete ? (
              /* All questions completed - show Run Analysis button */
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>All questions completed!</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>You&apos;ve answered {questions.length} questions. Now let AI analyze your responses.</p>
                <button onClick={() => runStage(nextAnalysisStage)} disabled={!!runningStage} style={{ padding: '12px 28px', border: 'none', borderRadius: '10px', background: '#0f172a', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                  {runningStage ? 'Analyzing...' : `Run ${STAGES.find(s => s.key === nextAnalysisStage)?.label} →`}
                </button>
              </div>
            ) : ANALYSIS_STAGES.includes(project.current_stage) ? (
              /* Analysis stage - show stage-specific content + run button */
              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <button onClick={() => runStage(project.current_stage)} disabled={!!runningStage} style={{ padding: '12px 28px', border: 'none', borderRadius: '10px', background: '#0f172a', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                    {runningStage ? 'Analyzing...' : stageFindings.length > 0 ? 'Re-run Analysis' : 'Run Analysis →'}
                  </button>
                  {nextAnalysisStage && (
                    <button onClick={() => runStage(nextAnalysisStage)} disabled={!!runningStage} style={{ padding: '12px 28px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                      Skip to {STAGES.find(s => s.key === nextAnalysisStage)?.label} →
                    </button>
                  )}
                </div>
                <StageFindingsView stage={project.current_stage} findings={stageFindings} opportunities={opportunities} onEditOpp={openOppEditor} onDeleteOpp={handleDeleteOpp} onAddOpp={() => setShowAddOpp(true)} />
              </div>
            ) : allAnalysisComplete ? (
              /* All analysis complete - show Generate Report button */
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Ready for your report!</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>All analysis stages are complete. Generate your full market research report with action plan.</p>
                <button onClick={generateReport} disabled={!!runningStage} style={{ padding: '12px 28px', border: 'none', borderRadius: '10px', background: '#2563eb', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                  {runningStage ? 'Generating...' : 'Generate Report →'}
                </button>
              </div>
            ) : null}

            {/* Previous Answers */}
            {questions.length > 0 && (
              <div style={{ marginTop: '28px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px', color: '#64748b' }}>Previous Answers ({questions.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {questions.map((q) => (
                    <div key={q.id} style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Q: {q.question_text}</p>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>A: {q.answer_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Insights + Evidence */}
        <div style={{ width: '260px', minWidth: '260px', background: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: '20px 14px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', padding: '0 8px' }}>Insights</h3>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>Project</p>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>{project.title}</p>
          </div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>Status</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: project.status === 'completed' ? '#16a34a' : '#2563eb' }}>{project.status.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>Current Stage</p>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>{STAGES[currentStageIndex]?.label || project.current_stage}</p>
          </div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>Questions Answered</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{questions.length}</p>
          </div>
          <EvidencePanel projectId={projectId} />
        </div>
      </div>
      {/* Edit Project Modal */}
      {showEditModal && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowEditModal(false);
              setError('');
            }
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(15, 23, 42, 0.55)', overflowY: 'auto' }}
        >
          <div style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', borderRadius: '16px', background: '#ffffff', color: '#0f172a', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px' }}>Edit Project</h2>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px' }}>Update your project title and description.</p>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleSaveEdit}>
              <label htmlFor="edit-title" style={{ display: 'block', marginBottom: '7px', fontSize: '14px', fontWeight: 'bold' }}>Project Title</label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                maxLength={120}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '20px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px' }}
              />

              <label htmlFor="edit-description" style={{ display: 'block', marginBottom: '7px', fontSize: '14px', fontWeight: 'bold' }}>Description</label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                maxLength={5000}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '24px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', lineHeight: '1.6', resize: 'vertical', fontFamily: 'inherit' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setShowEditModal(false); setError(''); }} disabled={savingEdit} style={{ padding: '11px 18px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit || !editTitle.trim()} style={{ padding: '11px 18px', border: 'none', borderRadius: '8px', background: savingEdit ? '#64748b' : '#2563eb', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold' }}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Opportunity Modal */}
      {editingOpp && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditingOpp(null);
              setError('');
            }
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(15, 23, 42, 0.55)', overflowY: 'auto' }}
        >
          <div style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', borderRadius: '16px', background: '#ffffff', color: '#0f172a', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '24px' }}>Edit Opportunity</h2>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleSaveOpp}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Name</label>
                <input type="text" value={editingOpp.name} onChange={(e) => setEditingOpp({ ...editingOpp, name: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Customer</label>
                <input type="text" value={editingOpp.customer} onChange={(e) => setEditingOpp({ ...editingOpp, customer: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Problem</label>
                <textarea value={editingOpp.problem} onChange={(e) => setEditingOpp({ ...editingOpp, problem: e.target.value })} rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Proposed Solution</label>
                <textarea value={editingOpp.proposed_solution} onChange={(e) => setEditingOpp({ ...editingOpp, proposed_solution: e.target.value })} rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Differentiation</label>
                <textarea value={editingOpp.differentiation} onChange={(e) => setEditingOpp({ ...editingOpp, differentiation: e.target.value })} rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Business Model</label>
                <textarea value={editingOpp.business_model} onChange={(e) => setEditingOpp({ ...editingOpp, business_model: e.target.value })} rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <h3 style={{ margin: '20px 0 12px', fontSize: '18px' }}>Scorecard</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Problem Severity</label>
                  <select value={editingOpp.problem_severity} onChange={(e) => setEditingOpp({ ...editingOpp, problem_severity: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Competition</label>
                  <select value={editingOpp.competition} onChange={(e) => setEditingOpp({ ...editingOpp, competition: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Evidence Strength</label>
                  <select value={editingOpp.evidence_strength} onChange={(e) => setEditingOpp({ ...editingOpp, evidence_strength: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}>
                    <option value="limited">Limited</option>
                    <option value="moderate">Moderate</option>
                    <option value="strong">Strong</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => { setEditingOpp(null); setError(''); }} disabled={savingOpp} style={{ padding: '11px 18px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" disabled={savingOpp} style={{ padding: '11px 18px', border: 'none', borderRadius: '8px', background: savingOpp ? '#64748b' : '#2563eb', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold' }}>{savingOpp ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Opportunity Modal */}
      {showAddOpp && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddOpp(false);
              setError('');
            }
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(15, 23, 42, 0.55)' }}
        >
          <div style={{ width: '100%', maxWidth: '440px', padding: '30px', borderRadius: '16px', background: '#ffffff', color: '#0f172a', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '22px' }}>Add Opportunity</h2>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px' }}>{error}</div>}
            <form onSubmit={handleAddOpp}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Opportunity Name</label>
              <input type="text" value={newOppName} onChange={(e) => setNewOppName(e.target.value)} placeholder="e.g. Premium Service Tier" required style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', marginBottom: '24px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => { setShowAddOpp(false); setError(''); }} disabled={savingOpp} style={{ padding: '11px 18px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" disabled={savingOpp || !newOppName.trim()} style={{ padding: '11px 18px', border: 'none', borderRadius: '8px', background: savingOpp ? '#64748b' : '#2563eb', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold' }}>{savingOpp ? 'Adding...' : 'Add Opportunity'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StageFindingsView({ stage, findings, opportunities, onEditOpp, onDeleteOpp, onAddOpp }: { stage: string; findings: Finding[]; opportunities: Opportunity[]; onEditOpp: (opp: Opportunity) => void; onDeleteOpp: (oppId: string) => void; onAddOpp: () => void }) {
  if (findings.length === 0 && !(stage === 'opportunities' && opportunities.length > 0)) {
    return (
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>No findings yet. Click &quot;Run Analysis&quot; to generate findings for this stage.</p>
      </div>
    );
  }

  return (
    <div>
      <StageSummary stage={stage} findings={findings} opportunities={opportunities} onEditOpp={onEditOpp} onDeleteOpp={onDeleteOpp} onAddOpp={onAddOpp} />
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px', color: '#64748b' }}>Findings ({findings.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {findings.map((finding) => (
          <div key={finding.id} style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px', borderLeft: `4px solid ${finding.kind === 'evidence' ? '#16a34a' : finding.kind === 'no_evidence' ? '#dc2626' : '#2563eb'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                padding: '3px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 'bold',
                background: finding.kind === 'evidence' ? '#dcfce7' : finding.kind === 'no_evidence' ? '#fef2f2' : '#dbeafe',
                color: finding.kind === 'evidence' ? '#16a34a' : finding.kind === 'no_evidence' ? '#dc2626' : '#2563eb',
              }}>
                {finding.kind.replace('_', ' ').toUpperCase()}
              </span>
              {finding.gap_type && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{finding.gap_type}</span>}
            </div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{finding.text}</p>
          </div>
        ))}
      </div>

      {/* Show opportunities if this is the validation stage */}
      {stage === 'validation' && opportunities.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px', color: '#64748b' }}>Opportunities ({opportunities.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {opportunities.map((opp) => (
              <div key={opp.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <h4 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>{opp.name}</h4>
                <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Customer:</strong> {opp.customer}</div>
                  <div><strong>Problem:</strong> {opp.problem}</div>
                  <div><strong>Solution:</strong> {opp.proposed_solution}</div>
                  <div><strong>Differentiation:</strong> {opp.differentiation}</div>
                  <div><strong>Business Model:</strong> {opp.business_model}</div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', background: '#fef3c7', color: '#92400e' }}>Severity: {opp.problem_severity}</span>
                    <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', background: '#fef3c7', color: '#92400e' }}>Competition: {opp.competition}</span>
                    <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', background: '#dbeafe', color: '#1d4ed8' }}>Evidence: {opp.evidence_strength}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StageSummary({ stage, findings, opportunities, onEditOpp, onDeleteOpp, onAddOpp }: { stage: string; findings: Finding[]; opportunities: Opportunity[]; onEditOpp: (opp: Opportunity) => void; onDeleteOpp: (oppId: string) => void; onAddOpp: () => void }) {
  const stageFindings = findings.filter((f) => f.stage === stage);

  if (stageFindings.length === 0 && !(stage === 'opportunities' && opportunities.length > 0)) return null;

  if (stage === 'customer') {
    return (
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '18px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 'bold' }}>Customer Profile</h4>
        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
          {stageFindings.map((f) => (
            <div key={f.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #2563eb' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' }}>{f.kind}</span>
              <p style={{ margin: '4px 0 0', color: '#475569', lineHeight: 1.5 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'problem') {
    return (
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '18px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 'bold' }}>Problems Identified</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stageFindings.map((f, i) => (
            <div key={f.id} style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #dc2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>Problem {i + 1}</span>
                <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 'bold', background: f.kind === 'evidence' ? '#dcfce7' : '#dbeafe', color: f.kind === 'evidence' ? '#16a34a' : '#2563eb' }}>{f.kind}</span>
              </div>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'demand') {
    return (
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '18px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 'bold' }}>Demand Indicators</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stageFindings.map((f) => (
            <div key={f.id} style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '3px solid #16a34a' }}>
              <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 'bold', background: f.kind === 'evidence' ? '#dcfce7' : f.kind === 'no_evidence' ? '#fef2f2' : '#dbeafe', color: f.kind === 'evidence' ? '#16a34a' : f.kind === 'no_evidence' ? '#dc2626' : '#2563eb' }}>{f.kind}</span>
              <p style={{ margin: '6px 0 0', color: '#475569', lineHeight: 1.5 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'competitors') {
    return (
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '18px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 'bold' }}>Competitor Landscape</h4>
        {stageFindings.length === 0 ? (
          <p style={{ color: '#64748b' }}>No competitor data available. Add evidence about competitors to generate a detailed analysis.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stageFindings.map((f) => (
              <div key={f.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 'bold', background: f.kind === 'evidence' ? '#dcfce7' : '#dbeafe', color: f.kind === 'evidence' ? '#16a34a' : '#2563eb' }}>{f.kind}</span>
                <p style={{ margin: '6px 0 0', color: '#475569', lineHeight: 1.5 }}>{f.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (stage === 'gaps') {
    const gapTypeColors: Record<string, string> = {
      product: '#2563eb', service: '#7c3aed', price: '#dc2626', convenience: '#ea580c',
      quality: '#16a34a', accessibility: '#0891b2', geographic: '#9333ea', experience: '#c026d3',
    };
    return (
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '18px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 'bold' }}>Market Gaps</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stageFindings.map((f) => (
            <div key={f.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: `3px solid ${gapTypeColors[f.gap_type || ''] || '#2563eb'}` }}>
              {f.gap_type && (
                <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 'bold', background: `${gapTypeColors[f.gap_type] || '#2563eb'}15`, color: gapTypeColors[f.gap_type] || '#2563eb', textTransform: 'capitalize' }}>{f.gap_type}</span>
              )}
              <p style={{ margin: '6px 0 0', color: '#475569', lineHeight: 1.5 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'opportunities' && opportunities.length > 0) {
    return (
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Opportunities ({opportunities.length})</h4>
          <button onClick={onAddOpp} style={{ padding: '6px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ Add</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {opportunities.map((opp) => (
            <div key={opp.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{opp.name}</h5>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => onEditOpp(opp)} style={{ padding: '4px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Edit</button>
                  <button onClick={() => onDeleteOpp(opp.id)} style={{ padding: '4px 10px', border: '1px solid #fecaca', borderRadius: '6px', background: '#fef2f2', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: '#dc2626' }}>Delete</button>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#475569' }}>
                <div><strong>Customer:</strong> {opp.customer}</div>
                <div><strong>Problem:</strong> {opp.problem}</div>
                <div><strong>Solution:</strong> {opp.proposed_solution}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'validation' && opportunities.length > 0) {
    return (
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '18px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 'bold' }}>Validation Scorecards</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {opportunities.map((opp) => (
            <div key={opp.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 'bold' }}>{opp.name}</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '12px' }}>
                <div style={{ padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Problem Severity</span>
                  <strong style={{ color: opp.problem_severity === 'high' ? '#dc2626' : opp.problem_severity === 'medium' ? '#ea580c' : '#16a34a' }}>{opp.problem_severity.toUpperCase()}</strong>
                </div>
                <div style={{ padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Competition</span>
                  <strong style={{ color: opp.competition === 'high' ? '#dc2626' : opp.competition === 'medium' ? '#ea580c' : '#16a34a' }}>{opp.competition.toUpperCase()}</strong>
                </div>
                <div style={{ padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Evidence Strength</span>
                  <strong style={{ color: opp.evidence_strength === 'strong' ? '#16a34a' : opp.evidence_strength === 'moderate' ? '#ea580c' : '#dc2626' }}>{opp.evidence_strength.toUpperCase()}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function EvidencePanel({ projectId }: { projectId: string }) {
  const [evidenceItems, setEvidenceItems] = useState<Array<{ id: string; quote_or_note: string; source_label: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [quoteOrNote, setQuoteOrNote] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadEvidence = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/evidence`);
      if (!res.ok) return;
      const data = await res.json();
      setEvidenceItems(data.evidence || []);
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => { void loadEvidence(); }, [loadEvidence]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteOrNote.trim()) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteOrNote: quoteOrNote.trim(), sourceLabel: sourceLabel.trim() || 'user note', url: url.trim() || null }),
      });
      if (!res.ok) { setMessage('Failed to add evidence'); return; }
      setQuoteOrNote('');
      setSourceLabel('');
      setUrl('');
      setShowForm(false);
      setMessage('Evidence added.');
      await loadEvidence();
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (evidenceId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/evidence?evidenceId=${evidenceId}`, { method: 'DELETE' });
      await loadEvidence();
    } catch { /* ignore */ }
  };

  return (
    <div style={{ marginTop: '18px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', margin: 0 }}>Evidence ({evidenceItems.length})</p>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '4px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {message && <p style={{ fontSize: '11px', color: '#2563eb', margin: '0 0 8px' }}>{message}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          <textarea placeholder="Paste a URL, quote, or note..." value={quoteOrNote} onChange={(e) => setQuoteOrNote(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', resize: 'vertical', boxSizing: 'border-box' }} />
          <input type="text" placeholder="Source (e.g. Google, LinkedIn)" value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} />
          <input type="text" placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} />
          <button type="submit" disabled={submitting || !quoteOrNote.trim()} style={{ padding: '8px', border: 'none', borderRadius: '6px', background: submitting ? '#94a3b8' : '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            {submitting ? 'Adding...' : 'Add Evidence'}
          </button>
        </form>
      )}

      {evidenceItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {evidenceItems.slice(0, 5).map((item) => (
            <div key={item.id} style={{ padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
              <p style={{ margin: '0 0 4px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.quote_or_note}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>{item.source_label}</span>
                <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '10px', padding: 0 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
