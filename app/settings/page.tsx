'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (res.status === 401) { router.replace('/login'); return; }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setName(data.user.name || '');
        setEmail(data.user.email || '');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadUser(); }, [loadUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setMessage('Profile updated successfully.');
      setUser(prev => prev ? { ...prev, name: data.user.name, email: data.user.email } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This will permanently delete all your projects, findings, and reports. This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');
      localStorage.removeItem('launchkit_token');
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}><p style={{ color: '#64748b' }}>Loading settings...</p></main>;
  if (!user) return null;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ padding: '20px clamp(20px, 6vw, 80px)', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 23, fontWeight: 800 }}>LaunchKit<span style={{ color: '#2563eb' }}>.</span></span>
        <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: 14 }}>Back to Dashboard</Link>
      </nav>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>
        <p style={{ margin: '0 0 10px', color: '#2563eb', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1.7, fontWeight: 800 }}>Account Settings</p>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: '-1.2px', margin: '0 0 8px' }}>Settings</h1>
        <p style={{ color: '#64748b', marginBottom: '36px' }}>Manage your account information and preferences.</p>

        {message && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{message}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px' }}>{error}</div>}

        {/* Profile Section */}
        <form onSubmit={handleSaveProfile} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '20px' }}>Profile Information</h2>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="settings-name" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Full Name</label>
            <input id="settings-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="settings-email" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Email Address</label>
            <input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={200} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px' }} />
          </div>
          <button type="submit" disabled={savingProfile} style={{ padding: '12px 24px', border: 'none', borderRadius: '9px', background: savingProfile ? '#94a3b8' : '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Password Section */}
        <form onSubmit={handleChangePassword} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '20px' }}>Change Password</h2>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="current-password" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Current Password</label>
            <input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" required style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="new-password" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>New Password</label>
            <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 characters)" required minLength={6} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="confirm-password" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Confirm New Password</label>
            <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required minLength={6} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px' }} />
          </div>
          <button type="submit" disabled={savingPassword} style={{ padding: '12px 24px', border: 'none', borderRadius: '9px', background: savingPassword ? '#94a3b8' : '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            {savingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        {/* Danger Zone */}
        <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: '16px', padding: '32px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#dc2626' }}>Danger Zone</h2>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>Once you delete your account, there is no going back. All your projects, findings, and reports will be permanently deleted.</p>
          <button onClick={handleDeleteAccount} style={{ padding: '12px 24px', border: '1px solid #fecaca', borderRadius: '9px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            Delete Account
          </button>
        </div>
      </section>
    </main>
  );
}
