'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState('')

  useEffect(() => {
    setYear(new Date().getFullYear().toString())
  }, [])

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    setUser(null)
    router.push('/')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 60px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#0f172a',
            textDecoration: 'none',
          }}
        >
          LaunchKit<span style={{ color: '#2563eb' }}>.</span>
        </Link>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {loading ? null : user ? (
            <>
              <Link
                href="/dashboard"
                style={{
                  padding: '10px 20px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  textDecoration: 'none',
                }}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  padding: '10px 20px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  textDecoration: 'none',
                }}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '120px 24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#2563eb',
            letterSpacing: '1px',
          }}
        >
          FROM IDEA TO LAUNCH
        </p>

        <h1
          style={{
            fontSize: '64px',
            lineHeight: '1.1',
            margin: '0 auto 24px',
            maxWidth: '850px',
          }}
        >
          Turn your business idea into a{' '}
          <span style={{ color: '#2563eb' }}>business ready to launch.</span>
        </h1>

        <p
          style={{
            fontSize: '20px',
            lineHeight: '1.6',
            color: '#334155',
            maxWidth: '700px',
            margin: '0 auto 40px',
          }}
        >
          LaunchKit helps new entrepreneurs turn their ideas into
          professional businesses with the tools, guidance, branding,
          websites, and resources they need to get started.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link
            href={user ? '/dashboard' : '/signup'}
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            {user ? 'Go to Dashboard →' : 'Build My Business →'}
          </Link>
          <a
            href="#features"
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '18px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          background: '#ffffff',
          padding: '70px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '36px', marginBottom: '15px' }}>
            Everything you need to get started
          </h2>

          <p
            style={{
              color: '#64748b',
              fontSize: '18px',
              marginBottom: '50px',
            }}
          >
            LaunchKit brings the important parts of starting a business
            together in one place.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                padding: '30px',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                background: '#ffffff',
              }}
            >
              <div style={{ fontSize: '30px', marginBottom: '18px' }}>💡</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Business Setup</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                Turn your idea into a clear business concept and plan.
              </p>
            </div>

            <div
              style={{
                padding: '30px',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                background: '#ffffff',
              }}
            >
              <div style={{ fontSize: '30px', marginBottom: '18px' }}>🎨</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Branding</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                Develop a professional business identity with a name,
                visual direction, and branding materials.
              </p>
            </div>

            <div
              style={{
                padding: '30px',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                background: '#ffffff',
              }}
            >
              <div style={{ fontSize: '30px', marginBottom: '18px' }}>🌐</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Website</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                Plan and create a professional online presence so
                customers can discover your business.
              </p>
            </div>

            <div
              style={{
                padding: '30px',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                background: '#ffffff',
              }}
            >
              <div style={{ fontSize: '30px', marginBottom: '18px' }}>📣</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Marketing</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                Prepare marketing materials and learn how to communicate
                your offer to potential customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '85px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(30px, 4vw, 40px)',
            marginBottom: '16px',
          }}
        >
          From Idea to Launch in Three Steps
        </h2>

        <p
          style={{
            color: '#64748b',
            fontSize: '18px',
            lineHeight: '1.7',
            marginBottom: '45px',
          }}
        >
          A simple starting point for people who want to build
          something of their own.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '30px',
            textAlign: 'left',
          }}
        >
          <div>
            <p style={{ color: '#2563eb', fontWeight: 'bold' }}>STEP 01</p>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Tell Us Your Idea</h3>
            <p style={{ color: '#64748b', lineHeight: '1.8' }}>
              Explain what you want to build and who you want to serve.
            </p>
          </div>

          <div>
            <p style={{ color: '#2563eb', fontWeight: 'bold' }}>STEP 02</p>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Build Your Foundation</h3>
            <p style={{ color: '#64748b', lineHeight: '1.8' }}>
              Organize your business plan, brand, website, and launch needs.
            </p>
          </div>

          <div>
            <p style={{ color: '#2563eb', fontWeight: 'bold' }}>STEP 03</p>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Prepare to Launch</h3>
            <p style={{ color: '#64748b', lineHeight: '1.8' }}>
              Bring your business essentials together and prepare to
              reach your first customers.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '85px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(32px, 4vw, 44px)',
              lineHeight: '1.2',
              marginBottom: '20px',
            }}
          >
            Your Idea Deserves a Real Launch.
          </h2>

          <p
            style={{
              color: '#cbd5e1',
              fontSize: '18px',
              lineHeight: '1.8',
              marginBottom: '32px',
            }}
          >
            You don't need to have everything figured out today.
            Start with your idea, and take the next step with LaunchKit.
          </p>

          <Link
            href={user ? '/dashboard' : '/signup'}
            style={{
              display: 'inline-block',
              padding: '16px 30px',
              borderRadius: '10px',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '17px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            {user ? 'Go to Dashboard →' : 'Get Started for Free →'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '25px 60px',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          flexWrap: 'wrap',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>
          LaunchKit<span style={{ color: '#2563eb' }}>.</span>
        </p>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Helping entrepreneurs move from idea to launch.
        </p>

        <p
          style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: '13px',
          }}
        >
          © {year} LaunchKit
        </p>
      </footer>
    </main>
  )
}
