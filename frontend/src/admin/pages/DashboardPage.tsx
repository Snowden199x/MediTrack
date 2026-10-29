import type { CSSProperties, ReactNode } from 'react'
import '../css/dashboard.css'

interface Props {
  totalResidents?: number
  pendingCount: number
  onSeeAllReports: () => void
  onReviewRegistrations: () => void
  onNewAnnouncement: () => void
}

type Tone = 'brand' | 'teal' | 'red' | 'coral' | 'deep'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const icons = {
  users: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  report: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </Icon>
  ),
  alert: (
    <Icon>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Icon>
  ),
  activity: (
    <Icon>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Icon>
  ),
  calendar: (
    <Icon>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </Icon>
  ),
  shield: (
    <Icon>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  ),
  clipboard: (
    <Icon>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </Icon>
  ),
  arrow: (
    <Icon>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </Icon>
  ),
}

export default function DashboardPage({ totalResidents = 0, pendingCount, onSeeAllReports, onReviewRegistrations, onNewAnnouncement }: Props) {
  const dateStr = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })
  const hour = new Date().getHours()
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  const greeting = `Good ${period}, Admin`

  const stats: { label: string; value: number; hint: string; tone: Tone; icon: ReactNode }[] = [
    { label: 'Total residents', value: totalResidents, hint: 'Approved accounts', tone: 'brand', icon: icons.users },
    { label: 'New reports', value: 0, hint: 'Waiting for review', tone: 'teal', icon: icons.report },
    { label: 'Emergency cases', value: 0, hint: 'Need action now', tone: 'red', icon: icons.alert },
    { label: 'Outbreak alerts', value: 0, hint: 'Active in a purok', tone: 'coral', icon: icons.activity },
    { label: 'Upcoming checkups', value: 0, hint: 'Scheduled ahead', tone: 'deep', icon: icons.calendar },
  ]

  return (
    <div className="admin-content dash">

      {/* Greeting row */}
      <div className="dash-greeting-row">
        <div className="dash-greeting-left">
          <span className="dash-greeting-date">{dateStr}</span>
          <h1 className="dash-greeting-text">{greeting}</h1>
        </div>
        <div className="dash-greeting-actions">
          <button className="admin-hdr-btn primary" onClick={onReviewRegistrations}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" fill="currentColor"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            </svg>
            Review registrations
            {pendingCount > 0 && <span className="admin-hdr-count">{pendingCount}</span>}
          </button>
          <button className="admin-hdr-btn" onClick={onNewAnnouncement}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 2a3 3 0 0 1 3 3v1l-1 1-4-4 1-1h1Z" fill="currentColor"/>
              <path d="M3 17.25V21h3.75L17 10.75l-3.75-3.75L3 17.25Z" fill="currentColor" opacity=".85"/>
            </svg>
            New announcement
          </button>
        </div>
      </div>

      <div className="dash-stat-grid">
        {stats.map(({ label, value, hint, tone, icon }, i) => {
          const hot = (tone === 'red' || tone === 'coral') && value > 0
          return (
            <article
              className={`dash-stat-card tone-${tone}${hot ? ' is-hot' : ''}`}
              style={{ '--i': i } as CSSProperties}
              key={label}
            >
              <span className="dash-stat-icon">{icon}</span>
              <div className="dash-stat-body">
                <span className="dash-stat-label">{label}</span>
                <strong>{value.toLocaleString('en-PH')}</strong>
                <span className="dash-stat-hint">{hint}</span>
              </div>
            </article>
          )
        })}
      </div>

      <section className="dash-panel">
        <header className="dash-panel-header">
          <div>
            <h2>Outbreak alerts</h2>
            <p>Get warned when several people in one purok report the same symptoms.</p>
          </div>
          <label className="dash-alert-at">
            <span>Alert at</span>
            <select defaultValue="3">
              <option value="3">3 cases</option>
              <option value="5">5 cases</option>
              <option value="10">10 cases</option>
            </select>
          </label>
        </header>

        <div className="dash-empty">
          <span className="dash-empty-icon">{icons.shield}</span>
          <strong>All clear</strong>
          <p>No alerts right now. One appears when several people in the same purok report the same symptoms.</p>
        </div>
      </section>

      <section className="dash-panel">
        <header className="dash-panel-header">
          <div>
            <h2>Most urgent reports</h2>
            <p>The newest and most serious symptom reports from residents.</p>
          </div>
          <button className="button secondary small dash-link" onClick={onSeeAllReports}>
            See all {icons.arrow}
          </button>
        </header>

        <div className="dash-empty dash-empty--soft">
          <span className="dash-empty-icon">{icons.clipboard}</span>
          <strong>No reports yet</strong>
          <p>Reports will appear here once residents submit symptom reports.</p>
        </div>
      </section>
    </div>
  )
}