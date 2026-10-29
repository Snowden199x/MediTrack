import { useEffect, useMemo, useState } from 'react'
import { CONCERNS } from '../../shared/symptomQuestions'
import SymptomReportDrawer from '../components/SymptomReportDrawer'
import '../css/accounts.css'
import '../css/dashboard.css'
import '../css/symptom-reports.css'
import {
  AREAS,
  CONCERN_LABELS,
  MOCK_CHECKUPS,
  MOCK_REPORTS,
  REPORT_STATUSES,
  SEVERITIES,
  SIMILAR_REPORT_RULE,
  findSimilarReportClusters,
  isUrgentReport,
  severityTone,
  type AreaCluster,
  type ReportStatus,
  type Severity,
  type SymptomReport,
} from '../symptomReportsConfig'

interface Props {
  onNotice: (message: string, type?: 'success' | 'error') => void
  /** Keeps the sidebar badge in step when a report changes status. */
  onNewReportCount: (count: number) => void
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" />
    </svg>
  )
}

function formatReported(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function sortReports(a: SymptomReport, b: SymptomReport): number {
  const aPinned = isUrgentReport(a) && a.status !== 'Resolved' ? 0 : 1
  const bPinned = isUrgentReport(b) && b.status !== 'Resolved' ? 0 : 1
  if (aPinned !== bPinned) return aPinned - bPinned
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

export default function SymptomReportsPage({ onNotice, onNewReportCount }: Props) {
  const [reports, setReports] = useState<SymptomReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [query, setQuery] = useState('')
  const [concernFilter, setConcernFilter] = useState<'all' | string>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all')
  const [alertFilter, setAlertFilter] = useState<AreaCluster | null>(null)

  // Sample data today; replace this effect with the real admin API call later.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReports(MOCK_REPORTS)
      setLoading(false)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [])

  const clusters = useMemo(() => findSimilarReportClusters(reports), [reports])

  const newCount = reports.filter(report => report.status === 'New').length

  // Tell the admin shell how many reports still need a first look.
  useEffect(() => {
    if (!loading) onNewReportCount(newCount)
  }, [newCount, loading, onNewReportCount])

  const urgentCount = reports.filter(report => isUrgentReport(report) && report.status !== 'Resolved').length
  const scheduledCount = reports.filter(report => report.status === 'Scheduled').length
  const resolvedThisWeek = reports.filter(report => {
    if (report.status !== 'Resolved' || !report.resolvedAt) return false
    return Date.now() - new Date(report.resolvedAt).getTime() <= 7 * 86_400_000
  }).length

  const normalizedQuery = query.trim().toLowerCase()

  const visibleReports = useMemo(() => {
    return reports
      .filter(report => !normalizedQuery || report.residentName.toLowerCase().includes(normalizedQuery))
      .filter(report => concernFilter === 'all' || report.mainConcern === concernFilter)
      .filter(report => severityFilter === 'all' || report.severity === severityFilter)
      .filter(report => areaFilter === 'all' || report.area === areaFilter)
      .filter(report => statusFilter === 'all' || report.status === statusFilter)
      .filter(report => !alertFilter || alertFilter.reportIds.includes(report.id))
      .sort(sortReports)
  }, [reports, normalizedQuery, concernFilter, severityFilter, areaFilter, statusFilter, alertFilter])

  const hasFilters = Boolean(
    normalizedQuery ||
    alertFilter ||
    concernFilter !== 'all' ||
    severityFilter !== 'all' ||
    areaFilter !== 'all' ||
    statusFilter !== 'all',
  )

  const selected = reports.find(report => report.id === selectedId) ?? null
  const selectedHistory = selected
    ? reports.filter(report => report.residentId === selected.residentId && report.id !== selected.id)
    : []
  const selectedCheckups = selected
    ? MOCK_CHECKUPS.filter(checkup => checkup.residentId === selected.residentId)
    : []

  function clearFilters() {
    setQuery('')
    setConcernFilter('all')
    setSeverityFilter('all')
    setAreaFilter('all')
    setStatusFilter('all')
    setAlertFilter(null)
  }

  function updateReport(id: number, patch: Partial<SymptomReport>, message: string) {
    setReports(previous => previous.map(report => (
      report.id === id ? { ...report, ...patch } : report
    )))
    onNotice(message)
  }

  const statCards = [
    {
      label: 'New reports',
      value: newCount,
      hint: 'Waiting for review',
      tone: 'teal',
      icon: <UsersIcon />,
      hot: false,
    },
    {
      label: 'Urgent reports',
      value: urgentCount,
      hint: 'Severe or trouble breathing',
      tone: 'red',
      icon: <AlertIcon />,
      hot: urgentCount > 0,
    },
    {
      label: 'Scheduled checkups',
      value: scheduledCount,
      hint: 'Residents with a date',
      tone: 'brand',
      icon: <CalendarIcon />,
      hot: false,
    },
    {
      label: 'Resolved this week',
      value: resolvedThisWeek,
      hint: 'Last 7 days',
      tone: 'deep',
      icon: <CheckIcon />,
      hot: false,
    },
  ]

  return (
    <div className="admin-content sr-page">
      <div className="admin-page-header">
        <h1>Symptom reports</h1>
        <p>Review what residents shared and decide the next step. The system groups symptoms only — it never names a disease.</p>
      </div>

      {/* Summary cards */}
      <div className="sr-stat-grid">
        {statCards.map(card => (
          <article className={`dash-stat-card tone-${card.tone}${card.hot ? ' is-hot' : ''}`} key={card.label}>
            <span className="dash-stat-icon">{card.icon}</span>
            <div className="dash-stat-body">
              <span className="dash-stat-label">{card.label}</span>
              <strong>{card.value.toLocaleString('en-PH')}</strong>
              <span className="dash-stat-hint">{card.hint}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Area alert — uses SIMILAR_REPORT_RULE from symptomReportsConfig */}
      {clusters.length > 0 && (
        <div className="sr-alerts">
          {clusters.slice(0, 2).map(cluster => {
            const active = alertFilter?.area === cluster.area && alertFilter.concern === cluster.concern
            return (
              <div className={`sr-alert${active ? ' is-active' : ''}`} key={`${cluster.area}-${cluster.concern}`} role="status">
                <span className="sr-alert-icon" aria-hidden="true"><AlertIcon /></span>
                <div className="sr-alert-text">
                  <strong>
                    {cluster.count} residents in {cluster.area} reported{' '}
                    {CONCERN_LABELS[cluster.concern].toLowerCase()} in the last {cluster.withinDays} days.
                  </strong>
                  <p>
                    Same concern, same area. Check if they need a follow-up visit — this is a symptom
                    grouping, not a diagnosis.
                  </p>
                </div>
                <button
                  className="button small"
                  onClick={() => setAlertFilter(active ? null : cluster)}
                >
                  {active ? 'Clear this view' : 'View these reports'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="sr-filters">
        <label className="sr-filter sr-filter-search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Resident name"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </label>

        <label className="sr-filter">
          <span>Concern</span>
          <select value={concernFilter} onChange={event => setConcernFilter(event.target.value)}>
            <option value="all">All concerns</option>
            {CONCERNS.map(concern => (
              <option key={concern.key} value={concern.key}>{concern.label}</option>
            ))}
          </select>
        </label>

        <label className="sr-filter">
          <span>Severity</span>
          <select
            value={severityFilter}
            onChange={event => setSeverityFilter(event.target.value as 'all' | Severity)}
          >
            <option value="all">All severities</option>
            {SEVERITIES.map(severity => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </select>
        </label>

        <label className="sr-filter">
          <span>Area</span>
          <select value={areaFilter} onChange={event => setAreaFilter(event.target.value)}>
            <option value="all">All areas</option>
            {AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </label>

        <label className="sr-filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as 'all' | ReportStatus)}
          >
            <option value="all">All statuses</option>
            {REPORT_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <button type="button" className="sr-clear" onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      {alertFilter && (
        <p className="sr-alert-filter">
          Showing {alertFilter.count} reports from {alertFilter.area}.
          <button type="button" onClick={() => setAlertFilter(null)}>Show all reports</button>
        </p>
      )}

      {/* Reports table */}
      <section className="sr-panel">
        <div className="sr-panel-head">
          <h2>
            Reports
            <span className="sr-count">{visibleReports.length}</span>
          </h2>
          <p>Newest first, with severe and breathing reports kept at the top.</p>
        </div>

        {loading ? (
          <p className="loading" role="status">Loading symptom reports…</p>
        ) : visibleReports.length === 0 ? (
          <div className="sr-empty">
            <strong>{reports.length === 0 ? 'No symptom reports yet' : 'No reports match these filters'}</strong>
            <p>
              {reports.length === 0
                ? 'Reports sent by residents will appear here.'
                : 'Try another name, concern, severity, area, or status.'}
            </p>
            {reports.length > 0 && hasFilters && (
              <button type="button" className="button secondary small" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th className="sr-col-resident">Resident</th>
                  <th className="sr-col-area">Area</th>
                  <th className="sr-col-concern">Main concern</th>
                  <th className="sr-col-severity">Severity</th>
                  <th className="sr-col-date">Date reported</th>
                  <th className="sr-col-status">Status</th>
                  <th className="sr-col-action"><span className="visually-hidden">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleReports.map(report => {
                  const urgent = isUrgentReport(report)
                  return (
                    <tr key={report.id} className={urgent ? 'is-urgent' : ''}>
                      <td className="sr-col-resident" data-label="Resident" title={report.residentName}>
                        <strong>{report.residentName}</strong>
                      </td>
                      <td className="sr-col-area" data-label="Area" title={report.area}>{report.area}</td>
                      <td className="sr-col-concern" data-label="Main concern" title={CONCERN_LABELS[report.mainConcern]}>
                        {CONCERN_LABELS[report.mainConcern]}
                      </td>
                      <td className="sr-col-severity" data-label="Severity">
                        <span className={`sr-severity tone-${severityTone(report)}`}>{report.severity}</span>
                      </td>
                      <td className="sr-col-date" data-label="Date reported" title={new Date(report.createdAt).toLocaleString('en-PH')}>
                        {formatReported(report.createdAt)}
                      </td>
                      <td className="sr-col-status" data-label="Status">
                        <span className={`sr-status is-${report.status.toLowerCase()}`}>{report.status}</span>
                      </td>
                      <td className="sr-col-action">
                        <button
                          className="icon-button"
                          aria-label={`View report from ${report.residentName}`}
                          title="View report"
                          onClick={() => setSelectedId(report.id)}
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="sr-rule-note">
        Area alerts use one editable rule: {SIMILAR_REPORT_RULE.minimumReports} or more reports of the
        same concern, in the same area, within {SIMILAR_REPORT_RULE.withinDays} days.
      </p>

      {selected && (
        <SymptomReportDrawer
          report={selected}
          pastReports={selectedHistory}
          checkups={selectedCheckups}
          onClose={() => setSelectedId(null)}
          onUpdate={updateReport}
          onNotice={onNotice}
        />
      )}
    </div>
  )
}
