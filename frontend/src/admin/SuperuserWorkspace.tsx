import { useEffect, useState } from 'react'
import { api } from '../shared/api'
import AdminSidebar from './AdminSidebar'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'
import SchedulePage from './pages/SchedulePage'
import PostsPage from './pages/PostsPage'
import ResidentAccountsPage from './pages/ResidentAccountsPage'
import CheckupLogsPage from './pages/CheckupLogsPage'
import './css/layout.css'

type Section = 'overview' | 'reports' | 'schedule' | 'posts' | 'accounts' | 'bhw'

export default function SuperuserWorkspace({ user, onLogout }) {
  const [section, setSection] = useState<Section>('overview')
  const [registrations, setRegistrations] = useState([])
  const [reasons, setReasons] = useState<Record<number, string>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let ok = true
    async function load() {
      try {
        const r = await api('/admin/registrations')
        if (ok) { setRegistrations(r.data || []); setError('') }
      } catch (e: any) { if (ok) setError(e.message) }
      finally { if (ok) setLoading(false) }
    }
    void load()
    return () => { ok = false }
  }, [])

  async function review(registration, decision: 'approve' | 'reject') {
    setBusyId(registration.id); setNotice(''); setError('')
    try {
      await api(`/admin/registrations/${registration.id}`, {
        method: 'PATCH',
        body: { decision, rejection_reason: reasons[registration.id] || '' },
      })
      setNotice(decision === 'approve'
        ? `${registration.name} was approved.`
        : `${registration.name}'s registration was rejected.`)
      setReasons(p => { const n = { ...p }; delete n[registration.id]; return n })
      const r = await api('/admin/registrations')
      setRegistrations(r.data || [])
    } catch (e: any) { setError(e.message) }
    finally { setBusyId(null) }
  }

  return (
    <div className="admin-shell">
      <AdminSidebar
        user={user}
        section={section}
        pendingCount={registrations.length}
        onSection={setSection}
        onLogout={onLogout}
      />

      <main className="admin-main">
        {notice && (
          <div style={{ padding: '20px 40px 0' }}>
            <p className="notice" role="status">{notice}</p>
          </div>
        )}
        {error && (
          <div style={{ padding: '20px 40px 0' }}>
            <p className="notice error" role="alert">{error}</p>
          </div>
        )}

        {section === 'overview' && (
          <DashboardPage
            pendingCount={registrations.length}
            onSeeAllReports={() => setSection('reports')}
          />
        )}
        {section === 'reports' && <ReportsPage />}
        {section === 'schedule' && <SchedulePage />}
        {section === 'posts' && <PostsPage />}
        {section === 'accounts' && (
          <ResidentAccountsPage
            registrations={registrations}
            loading={loading}
            busyId={busyId}
            reasons={reasons}
            onReasonChange={(id, value) => setReasons(p => ({ ...p, [id]: value }))}
            onReview={review}
          />
        )}
        {section === 'bhw' && (
          <CheckupLogsPage
            onNotice={setNotice}
            onError={setError}
          />
        )}
      </main>
    </div>
  )
}
