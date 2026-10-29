import {
  IconHome, IconReport, IconCheckup, IconNews, IconRegister, IconLogout, IconBrandPlus,
} from './ResidentIcons'
import '../css/sidebar.css'

export type ResidentSection = 'home' | 'report' | 'checkups' | 'news' | 'register'

interface Props {
  user: { name: string }
  section: ResidentSection
  onSection: (s: ResidentSection) => void
  onLogout: () => void
}

export default function ResidentSidebar({ user, section, onSection, onLogout }: Props) {
  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside className="resident-sidebar">
      {/* Brand */}
      <div className="resident-sidebar-brand">
        <div className="resident-brand-mark"><IconBrandPlus /></div>
        <div className="resident-sidebar-brand-text">
          <strong>Barangay Health</strong>
          <strong>Center</strong>
          <span>Prototype · sample data</span>
        </div>
        <button
          className="resident-sidebar-logout resident-mobile-logout"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
        >
          <IconLogout />
        </button>
      </div>

      {/* Nav */}
      <nav className="resident-nav" aria-label="Resident navigation">
        <button className={section === 'home' ? 'active' : ''} onClick={() => onSection('home')}>
          <span className="resident-nav-icon"><IconHome /></span>Home
        </button>
        <button className={section === 'report' ? 'active' : ''} onClick={() => onSection('report')}>
          <span className="resident-nav-icon"><IconReport /></span>Report symptoms
        </button>
        <button className={section === 'checkups' ? 'active' : ''} onClick={() => onSection('checkups')}>
          <span className="resident-nav-icon"><IconCheckup /></span>My checkups
        </button>
        <button className={section === 'news' ? 'active' : ''} onClick={() => onSection('news')}>
          <span className="resident-nav-icon"><IconNews /></span>News
        </button>
        <button className={section === 'register' ? 'active' : ''} onClick={() => onSection('register')}>
          <span className="resident-nav-icon"><IconRegister /></span>Register an account
        </button>
      </nav>

      {/* Footer */}
      <div className="resident-sidebar-footer">
        <div className="resident-sidebar-user">
          <span className="resident-sidebar-avatar">{initials}</span>
          <div className="resident-sidebar-user-info">
            <strong>{user.name}</strong>
            <span>Resident</span>
          </div>
        </div>
        <button className="resident-sidebar-logout" onClick={onLogout}>
          <span className="resident-nav-icon"><IconLogout /></span>Log out
        </button>
      </div>
    </aside>
  )
}
