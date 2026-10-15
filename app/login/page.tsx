'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Clear any stale session cookies on mount
  useEffect(() => {
    document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '450px',
          background: '#ffffff',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            color: '#0f172a',
            marginBottom: '10px',
          }}
        >
          Welcome back
        </h1>

        <p
          style={{
            color: '#475569',
            marginBottom: '30px',
            lineHeight: '1.5',
          }}
        >
          Log in to continue building your business.
        </p>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: 'block',
              color: '#0f172a',
              fontWeight: '600',
              marginBottom: '8px',
            }}
          >
            Email Address
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '13px',
              marginBottom: '20px',
              border: '1px solid #94a3b8',
              borderRadius: '8px',
              boxSizing: 'border-box',
              color: '#0f172a',
              background: '#ffffff',
              fontSize: '16px',
            }}
          />

          <label
            style={{
              display: 'block',
              color: '#0f172a',
              fontWeight: '600',
              marginBottom: '8px',
            }}
          >
            Password
          </label>

          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '13px',
              marginBottom: '25px',
              border: '1px solid #94a3b8',
              borderRadius: '8px',
              boxSizing: 'border-box',
              color: '#0f172a',
              background: '#ffffff',
              fontSize: '16px',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              background: loading ? '#94a3b8' : '#0f172a',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#2563eb', fontWeight: 'bold' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  )
}
