'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Signup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      // Auto-login after signup
      const loginRes = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (loginRes.ok) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
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
          Create your LaunchKit account
        </h1>

        <p
          style={{
            color: '#475569',
            marginBottom: '30px',
            lineHeight: '1.5',
          }}
        >
          Start turning your business idea into a professional business.
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

        <form onSubmit={handleSignup}>
          <label
            style={{
              display: 'block',
              color: '#0f172a',
              fontWeight: '600',
              marginBottom: '8px',
            }}
          >
            Full Name
          </label>

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            placeholder="Create a password"
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
            {loading ? 'Creating account...' : 'Get Started'}
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
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#2563eb', fontWeight: 'bold' }}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
