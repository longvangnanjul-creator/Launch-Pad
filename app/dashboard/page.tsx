'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
}

interface Project {
  id: string
  title: string
  description: string
  status: string
  current_stage: string
  asset_type: string
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newAssetType, setNewAssetType] = useState('idea')
  const [creating, setCreating] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const [pageError, setPageError] = useState('')

  const loadSession = useCallback(async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })

      if (response.status === 401) {
        router.replace('/login')
        return null
      }

      if (!response.ok) {
        throw new Error(`Session request failed (${response.status})`)
      }

      const data = await response.json()

      if (!data.user) {
        return null
      }

      setUser(data.user)
      return data.user as User
    } catch (err) {
      console.error('Unable to check login session:', err)
      router.replace('/login')
      return null
    }
  }, [router])

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects', {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      if (!response.ok) {
        throw new Error(`Projects request failed (${response.status})`)
      }

      const data = await response.json()
      setProjects(Array.isArray(data.projects) ? data.projects : [])
      setPageError('')
    } catch (err) {
      console.error('Unable to load projects:', err)

      setPageError(
        'Your projects could not be loaded. Check your connection and try again.'
      )
    }
  }, [router])

  const initializeDashboard = useCallback(async () => {
    setLoading(true)
    setPageError('')

    try {
      const sessionUser = await loadSession()

      if (!sessionUser) {
        router.replace('/login')
        return
      }

      await loadProjects()
    } finally {
      setLoading(false)
    }
  }, [loadSession, loadProjects, router])

  useEffect(() => {
    void initializeDashboard()
  }, [initializeDashboard])

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      router.replace('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout failed:', err)
      setPageError('We could not log you out. Please try again.')
      setLoggingOut(false)
    }
  }

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setCreating(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          asset_type: newAssetType,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      if (!response.ok) {
        setError(data.error || 'Unable to create your project.')
        return
      }

      setNewTitle('')
      setNewDescription('')
      setNewAssetType('idea')
      setShowNewProject(false)

      await loadProjects()
    } catch (err) {
      console.error('Project creation failed:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this project? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        window.alert(data.error || 'Unable to delete this project.')
        return
      }

      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId)
      )
    } catch (err) {
      console.error('Project deletion failed:', err)
      window.alert('Something went wrong. Please try again.')
    }
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      onboarding: 'Getting Started',
      questioning: 'AI Questions',
      customer: 'Customer Analysis',
      problem: 'Problem Analysis',
      demand: 'Demand Analysis',
      competitors: 'Competitor Analysis',
      gaps: 'Market Gaps',
      opportunities: 'Opportunities',
      validation: 'Validation',
      report: 'Report',
    }

    return labels[stage] || stage || 'Getting Started'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#16a34a'
      case 'in_progress':
        return '#2563eb'
      default:
        return '#94a3b8'
    }
  }

  const buttonStyle = {
    padding: '12px 22px',
    border: 'none',
    borderRadius: '9px',
    background: '#0f172a',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '14px',
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          background: '#f8fafc',
          fontFamily: 'Arial, sans-serif',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '4px solid #dbeafe',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'launchkit-spin 0.8s linear infinite',
          }}
        />

        <style jsx>{`
          @keyframes launchkit-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>

        <h2 style={{ margin: 0, fontSize: '20px' }}>
          Loading LaunchKit...
        </h2>

        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Checking your account and projects.
        </p>
      </main>
    )
  }

  if (!user) {
    // Redirect to login immediately — don't show an error page
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f8fafc',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <p style={{ color: '#64748b' }}>Redirecting to login...</p>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a',
      }}
    >
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 6%',
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span style={{ color: '#64748b', fontSize: '14px' }}>
            {user.name || user.email}
          </span>

          <button
            onClick={() => router.push('/settings')}
            style={{
              padding: '9px 16px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Settings
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              padding: '9px 16px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#0f172a',
              cursor: loggingOut ? 'wait' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {loggingOut ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </nav>

      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '48px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 8px',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}
            >
              Your LaunchKit
            </p>

            <h1
              style={{
                margin: '0 0 10px',
                fontSize: 'clamp(30px, 5vw, 40px)',
                letterSpacing: '-1px',
              }}
            >
              Welcome to your dashboard
            </h1>

            <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>
              Turn your ideas into businesses. Manage your projects and track
              your progress in one place.
            </p>
          </div>

      <div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  }}
>
  <button
    onClick={() => router.push('/business/new')}
    style={{
      ...buttonStyle,
      background: '#2563eb',
    }}
  >
    + Create a Business
  </button>

  <button
    onClick={() => {
      setError('')
      setShowNewProject(true)
    }}
    style={buttonStyle}
  >
    + New Project
  </button>
</div>
        </div>

        {pageError && (
          <div
            role="alert"
            style={{
              marginBottom: '24px',
              padding: '14px 16px',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              background: '#fef2f2',
              color: '#b91c1c',
            }}
          >
            <p style={{ margin: '0 0 10px' }}>{pageError}</p>

            <button
              onClick={() => void initializeDashboard()}
              style={{
                ...buttonStyle,
                padding: '9px 14px',
                background: '#991b1b',
              }}
            >
              Retry
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '18px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '14px' }}>
              Total Projects
            </p>

            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
              {projects.length}
            </p>
          </div>

          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '14px' }}>
              In Progress
            </p>

            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
              {projects.filter((project) => project.status === 'in_progress').length}
            </p>
          </div>

          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '14px' }}>
              Completed
            </p>

            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
              {projects.filter((project) => project.status === 'completed').length}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '23px' }}>Your Projects</h2>

          <span style={{ color: '#64748b', fontSize: '14px' }}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>

        {projects.length === 0 ? (
          <div
            style={{
              padding: '64px 24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>

            <h3 style={{ margin: '0 0 12px', fontSize: '23px' }}>
              Your journey starts here
            </h3>

            <p
              style={{
                maxWidth: '450px',
                margin: '0 auto 24px',
                color: '#64748b',
                lineHeight: 1.7,
              }}
            >
              Create your first project to start exploring your business idea,
              identifying customers, and discovering opportunities.
            </p>

            <button
              onClick={() => setShowNewProject(true)}
              style={buttonStyle}
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {projects.map((project) => (
              <article
                key={project.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '24px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '19px', overflowWrap: 'anywhere' }}>
                    {project.title}
                  </h3>

                  <span
                    style={{
                      flexShrink: 0,
                      padding: '5px 9px',
                      borderRadius: '999px',
                      background: `${getStatusColor(project.status)}15`,
                      color: getStatusColor(project.status),
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                  >
                    {(project.status || 'new').replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <p
                  style={{
                    flex: 1,
                    margin: '0 0 20px',
                    color: '#64748b',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {project.description || 'No description provided.'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '20px',
                    color: '#64748b',
                    fontSize: '12px',
                  }}
                >
                  <span>
                    Stage: <strong>{getStageLabel(project.current_stage)}</strong>
                  </span>

                  <span>
                    Created:{' '}
                    {project.created_at
                      ? new Date(project.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => router.push(`/workspace/${project.id}`)}
                    style={{ ...buttonStyle, flex: 1, padding: '11px 12px' }}
                  >
                    Open Workspace →
                  </button>

                  <button
                    onClick={() => void handleDeleteProject(project.id)}
                    aria-label={`Delete ${project.title}`}
                    title="Delete project"
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showNewProject && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowNewProject(false)
              setError('')
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.55)',
            overflowY: 'auto',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '30px',
              borderRadius: '16px',
              background: '#ffffff',
              color: '#0f172a',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h2
              id="new-project-title"
              style={{ margin: '0 0 8px', fontSize: '25px' }}
            >
              Create a New Project
            </h2>

            <p
              style={{
                margin: '0 0 24px',
                color: '#64748b',
                fontSize: '14px',
                lineHeight: 1.6,
              }}
            >
              Tell LaunchKit what you want to build.
            </p>

            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '18px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <label
                htmlFor="project-title"
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                Project Title
              </label>

              <input
                id="project-title"
                type="text"
                placeholder="e.g. AI-powered fitness coaching"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                required
                maxLength={120}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: '20px',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              />

              <label
                htmlFor="asset-type"
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                What do you have?
              </label>

              <select
                id="asset-type"
                value={newAssetType}
                onChange={(event) => setNewAssetType(event.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: '20px',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  fontSize: '15px',
                }}
              >
                <option value="idea">Business Idea</option>
                <option value="skill">Skill</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="existing_business">Existing Business</option>
                <option value="none">Nothing Yet</option>
                <option value="industry">Industry I'm Interested In</option>
              </select>

              <label
                htmlFor="project-description"
                style={{
                  display: 'block',
                  marginBottom: '7px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                Description
              </label>

              <textarea
                id="project-description"
                placeholder="Describe your idea, product, skill, or business goal..."
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                required
                maxLength={5000}
                rows={5}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: '24px',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  resize: 'vertical',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProject(false)
                    setError('')
                  }}
                  disabled={creating}
                  style={{
                    padding: '11px 18px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    ...buttonStyle,
                    background: creating ? '#64748b' : '#2563eb',
                    cursor: creating ? 'wait' : 'pointer',
                  }}
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
