'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { isAdmin } from '@/lib/admin';

interface Stats {
  totalUsers: number;
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
}

interface RecentProject {
  id: string;
  title: string;
  status: string;
  current_stage: string;
  user_id: string;
  created_at: string;
}

interface ServiceRequest {
  id: string;
  project_id: string;
  user_id: string;
  service_type: string;
  description: string;
  budget: string | null;
  timeline: string | null;
  status: string;
  created_at: string;
  projects: { title: string } | null;
}

export default function AdminDashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalProjects: 0, completedProjects: 0, activeProjects: 0 });
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingRequest, setUpdatingRequest] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        const email = data.user?.email || null;
        setUserEmail(email);
        if (isAdmin(email)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      })
      .catch(() => setAuthorized(false));
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, projectsRes, requestsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/projects'),
        fetch('/api/admin/service-requests'),
      ]);
      const statsData = await statsRes.json();
      const projectsData = await projectsRes.json();
      const requestsData = await requestsRes.json();
      if (statsRes.ok) setStats(statsData.stats);
      if (projectsRes.ok) setProjects(projectsData.projects || []);
      if (requestsRes.ok) setServiceRequests(requestsData.requests || []);
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRequestStatus = async (requestId: string, status: string) => {
    setUpdatingRequest(requestId);
    try {
      const res = await fetch(`/api/admin/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setServiceRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status } : r))
        );
      }
    } catch {
      // ignore
    } finally {
      setUpdatingRequest('');
    }
  };

  useEffect(() => {
    if (authorized) void loadData();
  }, [authorized, loadData]);

  if (!authorized) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>Access Denied</h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            {userEmail ? `The account ${userEmail} does not have admin access.` : 'Please log in to continue.'}
          </p>
          <Link href="/dashboard" style={{ padding: '12px 24px', borderRadius: '9px', background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading admin dashboard...</p></main>;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ padding: '20px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 23, fontWeight: 800 }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span> <span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}>Admin</span></span>
        <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Back to Dashboard</Link>
      </nav>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 8px' }}>Platform Overview</h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Signed in as {userEmail}</p>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '40px' }}>
          {[
            { label: 'Total Users', value: stats.totalUsers, color: '#2563eb' },
            { label: 'Total Projects', value: stats.totalProjects, color: '#0f172a' },
            { label: 'Active Projects', value: stats.activeProjects, color: '#2563eb' },
            { label: 'Completed', value: stats.completedProjects, color: '#16a34a' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
              <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '14px' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '22px', margin: '0 0 16px' }}>Recent Projects</h2>
        {projects.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>No projects yet.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Stage</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{project.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', background: project.status === 'completed' ? '#dcfce7' : '#dbeafe', color: project.status === 'completed' ? '#16a34a' : '#2563eb' }}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{project.current_stage}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(project.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 style={{ fontSize: '22px', margin: '40px 0 16px' }}>Service Requests ({serviceRequests.length})</h2>
        {serviceRequests.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>No service requests yet. Requests from users will appear here.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Project</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Budget</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Timeline</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Received</th>
                </tr>
              </thead>
              <tbody>
                {serviceRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{req.service_type}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{req.projects?.title || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{req.budget || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{req.timeline || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={req.status}
                        disabled={updatingRequest === req.id}
                        onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff', cursor: 'pointer' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {serviceRequests.some((r) => r.status === 'pending') && (
          <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '13px', color: '#92400e' }}>
            {serviceRequests.filter((r) => r.status === 'pending').length} pending request(s) waiting for your review.
          </div>
        )}
      </section>
    </main>
  );
}
