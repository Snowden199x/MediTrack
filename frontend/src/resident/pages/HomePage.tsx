import type { ResidentSection } from '../ResidentSidebar'
import '../css/dashboard.css'

interface Appointment {
  id: number
  type: string
  scheduled_for: string
  status: string
}

interface Announcement {
  id: number
  title: string
  body: string
  category?: string
  created_at: string
  audience?: string
}

interface SymptomReport {
  id: number
  category: string
  created_at: string
  status: string
  review_note?: string
}

interface DashboardData {
  resident: { household: { barangay_name: string; purok?: string } }
  appointments: Appointment[]
  announcements: Announcement[]
  symptom_reports: SymptomReport[]
  requests: unknown[]
}

interface Props {
  user: { name: string }
  dashboard: DashboardData
  categories: Record<string, { label: string }>
  onSection: (s: ResidentSection) => void
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function audienceLabel(audience?: string): string {
  if (!audience || audience === 'all') return 'All'
  return audience.charAt(0).toUpperCase() + audience.slice(1)
}

export default function HomePage({ user, dashboard, categories, onSection }: Props) {
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })
  const purok = dashboard.resident.household.purok
  const firstName = user.name.split(' ')[0]

  const nextAppointment = dashboard.appointments[0] ?? null

  return (
    <div className="resident-content">
      {/* Greeting */}
      <div className="res-greeting">
        <h1>Good day, {firstName}</h1>
        <p>{purok ? `${purok} · ` : ''}{today}</p>
      </div>

      {/* Top cards row */}
      <div className="res-top-cards">
        {/* Next checkup */}
        <div className="res-card">
          <p className="res-card-label">Next checkup</p>
          {nextAppointment ? (
            <>
              <p className="res-card-value">{formatDate(nextAppointment.scheduled_for)}</p>
              <p className="res-card-sub">{nextAppointment.type}</p>
            </>
          ) : (
            <p className="res-card-sub" style={{ margin: 0 }}>No upcoming checkup scheduled.</p>
          )}
          <button className="button secondary small" onClick={() => onSection('checkups')}>
            View schedule
          </button>
        </div>

        {/* Report card */}
        <div className="res-card-report">
          <p className="res-card-label">Not feeling well?</p>
          <p className="res-card-value">Report how you feel</p>
          <p className="res-card-sub">Answer a few questions and get advice right away.</p>
          <button className="button" onClick={() => onSection('report')}>
            Start a report
          </button>
        </div>

        {/* Emergency numbers */}
        <div className="res-card res-card-emergency">
          <p className="res-card-label">Emergency numbers</p>
          <ul className="res-emergency-list">
            <li><strong>National emergency</strong><span>911</span></li>
            <li><strong>Health center</strong><span>0917 000 0000</span></li>
          </ul>
          <p className="res-card-hint">Sample numbers for the prototype.</p>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="res-bottom-grid">
        {/* News feed */}
        <section>
          <div className="res-section-header">
            <h2>Latest from the health center</h2>
            <button className="button secondary small" onClick={() => onSection('news')}>
              See all news
            </button>
          </div>

          {dashboard.announcements.length > 0 ? (
            <div className="res-news-list">
              {dashboard.announcements.slice(0, 5).map(item => (
                <article className="res-news-item" key={item.id}>
                  <div className="res-news-meta">
                    <span className={`badge${item.category ? ` badge-${item.category}` : ''}`}>
                      {item.category
                        ? item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, ' ')
                        : 'Announcement'}
                    </span>
                    <span>{relativeTime(item.created_at)} · {audienceLabel(item.audience)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">No announcements from the health center yet.</p>
          )}
        </section>

        {/* Recent reports */}
        <section className="res-reports-panel">
          <h2>My recent reports</h2>
          {dashboard.symptom_reports.length > 0 ? (
            <ul className="res-report-list">
              {dashboard.symptom_reports.slice(0, 5).map(item => (
                <li className="res-report-item" key={item.id}>
                  <span className="res-report-name">
                    {categories[item.category]?.label ?? item.category}
                  </span>
                  <span className="res-report-date">{relativeTime(item.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">No reports yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
