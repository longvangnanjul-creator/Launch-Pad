'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalProjects: 0, completedProjects: 0, activeProjects: 0 });
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [statsRes, projectsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/projects'),
      ]);
      const statsData = await statsRes.json();
      const projectsData = await projectsRes.json();
      if (statsRes.ok) setStats(statsData.stats);
      if (projectsRes.ok) setProjects(projectsData.projects || []);
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading admin dashboard...</p></main>;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ padding: '20px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 23, fontWeight: 800 }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span> <span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}>Admin</span></span>
        <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Back to Dashboard</Link>
      </nav>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 8px' }}>Platform Overview</h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Manage users, projects, and monitor platform activity.</p>

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
      </section>
    </main>
  );
}
