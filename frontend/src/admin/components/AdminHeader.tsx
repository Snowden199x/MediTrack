import '../css/header.css'
import type { AdminSection } from './adminTypes'

type Section = AdminSection

const sectionLabels: Record<Section, string> = {
  overview: 'Dashboard',
  reports: 'Reports',
  symptoms: 'Symptom reports',
  schedule: 'Schedule',
  posts: 'Posts',
  accounts: 'Resident accounts',
  bhw: 'Checkup logs',
  map: 'Resident map',
}

interface Props {
  user: { name: string }
  section: Section
  pendingCount: number
  onReviewRegistrations: () => void
  onNewAnnouncement: () => void
  onToggleSidebar: () => void
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

export default function AdminHeader({ user, section, pendingCount, onToggleSidebar }: Props) {
  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header className="admin-header">
      <div className="admin-header-bar">
        <div className="admin-header-bar-left">
          <button className="admin-header-menu-btn" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
            <MenuIcon />
          </button>
          <span className="admin-header-page-label">{sectionLabels[section]}</span>
        </div>

        <div className="admin-header-bar-right">
          <button className="admin-header-bell" aria-label="Notifications">
            <BellIcon />
            {pendingCount > 0 && <span className="admin-header-bell-dot" aria-hidden="true" />}
          </button>

          <div className="admin-header-user">
            <div className="admin-header-avatar">{initials}</div>
            <div className="admin-header-user-info">
              <strong>{user.name}</strong>
              <span>Super Administrator</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
