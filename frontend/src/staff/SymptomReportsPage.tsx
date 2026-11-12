import { useEffect, useMemo, useState } from 'react'
import { CONCERNS } from '../shared/symptomQuestions'
import SymptomReportDrawer from './SymptomReportDrawer'
import '../admin/css/accounts.css'
import '../admin/css/dashboard.css'
import './css/symptom-reports.css'
import {
  CONCERN_LABELS,
  REPORT_STATUSES,
  SEVERITIES,
  findSimilarReportClusters,
  isUrgentReport,
  severityTone,
  type AreaCluster,
  type ReportStatus,
  type Severity,
  type SymptomReport,
} from './symptomReportsConfig'

interface ApiReport {
  id: number; resident_id: number; category: string; onset_date: string | null; severity: string | null
  answers: Record<string, string>; details: string | null; status: string; review_note: string | null
  created_at: string; resident?: { id: number; name: string; household?: { barangay_name: string; address: string | null } }
}
interface Props { apiReports: ApiReport[]; reviewRule?: { minimum_reports: number; within_days: number }; onReview: (id: number, note: string) => Promise<boolean>; onNotice: (message: string, type?: 'success' | 'error') => void }
function fromApi(report: ApiReport): SymptomReport {
  return {
    id: report.id, residentId: report.resident_id, residentName: report.resident?.name ?? 'Resident',
    area: report.resident?.household?.barangay_name ?? '', contact: '', mainConcern: report.category as SymptomReport['mainConcern'],
    startDate: report.onset_date ?? '', severity: ({ mild: 'Mild', moderate: 'Moderate', severe: 'Severe', unsure: 'Not sure' }[report.severity ?? 'unsure'] ?? 'Not sure') as Severity,
    followUpAnswers: report.answers ?? {}, notes: report.details ?? '', createdAt: report.created_at,
    status: report.status === 'reviewed' ? 'Reviewed' : 'New', reviewNote: report.review_note,
  }
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

export default function SymptomReportsPage({ apiReports, reviewRule, onReview, onNotice }: Props) {
  const [reports, setReports] = useState<SymptomReport[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewNote, setReviewNote] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [query, setQuery] = useState('')
  const [concernFilter, setConcernFilter] = useState<'all' | string>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all')
  const [alertFilter, setAlertFilter] = useState<AreaCluster | null>(null)

  useEffect(() => {
    setReports(apiReports.map(fromApi))
    setLoading(false)
  }, [apiReports])

  const clusters = useMemo(() => reviewRule ? findSimilarReportClusters(reports, reviewRule.minimum_reports, reviewRule.within_days) : [], [reports, reviewRule])

  const newCount = reports.filter(report => report.status === 'New').length
  const reviewedCount = reports.filter(report => report.status === 'Reviewed').length
  const areaOptions = [...new Set(reports.map(report => report.area).filter(Boolean))]

  const urgentCount = reports.filter(report => isUrgentReport(report) && report.status !== 'Resolved').length

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
  const selectedCheckups: import('./symptomReportsConfig').CheckupHistoryEntry[] = []

  function clearFilters() {
    setQuery('')
    setConcernFilter('all')
    setSeverityFilter('all')
    setAreaFilter('all')
    setStatusFilter('all')
    setAlertFilter(null)
  }

  async function updateReport(id: number, patch: Partial<SymptomReport>, message: string) {
    if (patch.status === 'Reviewed') {
      if (!reviewNote.trim()) { onNotice('Add a review note before marking this report reviewed.', 'error'); return }
      if (!await onReview(id, reviewNote.trim())) return
      setReports(previous => previous.map(report => report.id === id ? { ...report, status: 'Reviewed', reviewNote: reviewNote.trim() } : report))
      setReviewNote('')
      onNotice(message)
    }
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
      label: 'Reviewed reports',
      value: reviewedCount,
      hint: 'Review completed',
      tone: 'brand',
      icon: <CalendarIcon />,
      hot: false,
    },
    {
      label: 'Reports shown',
      value: reports.length,
      hint: 'Current results',
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

      {/* Area alerts use the threshold returned by Laravel. */}
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
            {areaOptions.map(area => (
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

      {reviewRule && <p className="sr-rule-note">
        Area alerts use the server rule: {reviewRule.minimum_reports} or more reports of the
        same concern, in the same barangay, within {reviewRule.within_days} days.
      </p>}

      {selected && (
        <SymptomReportDrawer
          report={selected}
          pastReports={selectedHistory}
          checkups={selectedCheckups}
          onClose={() => setSelectedId(null)}
          onUpdate={updateReport}
          onNotice={onNotice}
          reviewNote={reviewNote}
          onReviewNoteChange={setReviewNote}
        />
      )}
    </div>
  )
}
