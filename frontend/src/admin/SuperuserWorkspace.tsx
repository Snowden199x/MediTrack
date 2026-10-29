import { useEffect, useState } from 'react'
import { api } from '../shared/api'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import AnnouncementModal from './components/AnnouncementModal'
import { ToastContainer, useToast } from './components/Toast'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'
import SymptomReportsPage from './pages/SymptomReportsPage'
import SchedulePage from './pages/SchedulePage'
import PostsPage from './pages/PostsPage'
import ResidentAccountsPage from './pages/ResidentAccountsPage'
import CheckupLogsPage from './pages/CheckupLogsPage'
import ResidentMapPage from './pages/ResidentMapPage'
import './css/layout.css'
import { MOCK_REPORTS } from './symptomReportsConfig'
import type { AdminSection } from './components/adminTypes'

type Section = AdminSection

export default function SuperuserWorkspace({ user, onLogout }) {
  const [section, setSection] = useState<Section>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [registrations, setRegistrations] = useState([])
  const [accountCounts, setAccountCounts] = useState({ residents: 0, pending: 0, archived: 0, bhw: 0, rejected: 0 })
  const [reasons, setReasons] = useState<Record<number, string>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  // Sidebar badge starts from the sample reports and is kept up to date by the page.
  const [newSymptomReports, setNewSymptomReports] = useState(
    () => MOCK_REPORTS.filter(report => report.status === 'New').length,
  )
  const { toasts, addToast, dismissToast } = useToast()

  async function loadRegistrations() {
    const r = await api('/admin/registrations')
    setRegistrations(r.data || [])
  }

  async function loadAccountCounts() {
    const r = await api('/admin/accounts')
    const counts = r.counts || {}
    // also count rejected residents (not in counts yet, derive from by_role_status)
    const byRoleStatus = r.by_role_status?.resident || {}
    setAccountCounts({
      residents: counts.residents ?? 0,
      pending: counts.pending ?? 0,
      archived: counts.archived ?? 0,
      bhw: counts.bhw ?? 0,
      rejected: byRoleStatus.rejected ?? 0,
    })
  }

  useEffect(() => {
    let ok = true
    async function load() {
      try {
        await Promise.all([loadRegistrations(), loadAccountCounts()])
      } catch (e: any) { if (ok) addToast(e.message, 'error') }
      finally { if (ok) setLoading(false) }
    }
    void load()
    return () => { ok = false }
  }, [])

  async function review(registration: any, decision: 'approve' | 'reject') {
    setBusyId(registration.id)
    try {
      await api(`/admin/registrations/${registration.id}`, {
        method: 'PATCH',
        body: { decision, rejection_reason: reasons[registration.id] || '' },
      })
      addToast(
        decision === 'approve'
          ? `${registration.name} was approved.`
          : `${registration.name}'s registration was rejected.`
      )
      setReasons(p => { const n = { ...p }; delete n[registration.id]; return n })
      const r = await api('/admin/registrations')
      setRegistrations(r.data || [])
      await loadAccountCounts()
    } catch (e: any) { addToast(e.message, 'error') }
    finally { setBusyId(null) }
  }

  return (
    <>
      <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <AdminSidebar
          user={user}
          section={section}
          pendingCount={registrations.length}
          newReportCount={newSymptomReports}
          collapsed={sidebarCollapsed}
          onSection={setSection}
          onLogout={onLogout}
        />

        <main className="admin-main">
          <AdminHeader
            user={user}
            section={section}
            pendingCount={registrations.length}
            onReviewRegistrations={() => setSection('accounts')}
            onNewAnnouncement={() => setShowAnnouncementModal(true)}
            onToggleSidebar={() => setSidebarCollapsed(c => !c)}
          />

          {section === 'overview' && (
            <DashboardPage
              pendingCount={registrations.length}
              onSeeAllReports={() => setSection('reports')}
              onReviewRegistrations={() => setSection('accounts')}
              onNewAnnouncement={() => setShowAnnouncementModal(true)}
            />
          )}
          {section === 'reports' && <ReportsPage />}
          {section === 'symptoms' && (
            <SymptomReportsPage onNotice={addToast} onNewReportCount={setNewSymptomReports} />
          )}
          {section === 'schedule' && <SchedulePage />}
          {section === 'posts' && (
            <PostsPage onNewAnnouncement={() => setShowAnnouncementModal(true)} />
          )}
          {section === 'accounts' && (
            <ResidentAccountsPage
              registrations={registrations}
              loading={loading}
              busyId={busyId}
              reasons={reasons}
              counts={accountCounts}
              onReasonChange={(id, value) => setReasons(p => ({ ...p, [id]: value }))}
              onReview={review}
            />
          )}
          {section === 'bhw' && (
            <CheckupLogsPage
              onNotice={msg => addToast(msg)}
              onError={msg => addToast(msg, 'error')}
            />
          )}
          {section === 'map' && (
            <ResidentMapPage
              onError={msg => addToast(msg, 'error')}
            />
          )}
        </main>
      </div>

      {showAnnouncementModal && (
        <AnnouncementModal
          onClose={() => setShowAnnouncementModal(false)}
          onSuccess={msg => { addToast(msg); setShowAnnouncementModal(false) }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
