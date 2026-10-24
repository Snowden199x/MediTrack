import {
  IconDashboard, IconReports, IconSchedule, IconPosts,
  IconResidents, IconCheckup, IconLogout, IconBrandPlus, IconMap,
} from './AdminIcons'
import type { AdminSection } from './adminTypes'
import './css/sidebar.css'

type Section = AdminSection

interface Props {
  user: { name: string }
  section: Section
  pendingCount: number
  collapsed: boolean
  onSection: (s: Section) => void
  onLogout: () => void
}

export default function AdminSidebar({ user, section, pendingCount, collapsed, onSection, onLogout }: Props) {
  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside className={`admin-sidebar${collapsed ? ' admin-sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="admin-sidebar-brand">
        <div className="admin-brand-mark"><IconBrandPlus /></div>
        <div className="admin-sidebar-brand-text">
          <strong>Barangay Health</strong>
          <strong>Center</strong>
          <span>MediTrack admin</span>
        </div>
        {/* Mobile logout — only visible when sidebar footer is hidden */}
        <button
          className="admin-sidebar-logout admin-mobile-logout"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
        >
          <IconLogout />
        </button>
      </div>

      {/* Nav */}
      <nav className="admin-nav" aria-label="Admin navigation">
        <button className={section === 'overview' ? 'active' : ''} onClick={() => onSection('overview')}>
          <span className="nav-icon"><IconDashboard /></span>Dashboard
        </button>
        <button className={section === 'reports' ? 'active' : ''} onClick={() => onSection('reports')}>
          <span className="nav-icon"><IconReports /></span>Reports
        </button>
        <button className={section === 'schedule' ? 'active' : ''} onClick={() => onSection('schedule')}>
          <span className="nav-icon"><IconSchedule /></span>Schedule
        </button>
        <button className={section === 'posts' ? 'active' : ''} onClick={() => onSection('posts')}>
          <span className="nav-icon"><IconPosts /></span>Posts
        </button>
        <button className={section === 'accounts' ? 'active' : ''} onClick={() => onSection('accounts')}>
          <span className="nav-icon"><IconResidents /></span>Resident accounts
          {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
        </button>
        <button className={section === 'bhw' ? 'active' : ''} onClick={() => onSection('bhw')}>
          <span className="nav-icon"><IconCheckup /></span>Checkup logs
        </button>
        <button className={section === 'map' ? 'active' : ''} onClick={() => onSection('map')}>
          <span className="nav-icon"><IconMap /></span>Resident map
        </button>
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <span className="admin-sidebar-avatar">{initials}</span>
          <div className="admin-sidebar-user-info">
            <strong>{user.name}</strong>
            <span>Admin</span>
          </div>
        </div>
        <button className="admin-sidebar-logout" onClick={onLogout}>
          <span className="nav-icon"><IconLogout /></span>Log out
        </button>
      </div>
    </aside>
  )
}
