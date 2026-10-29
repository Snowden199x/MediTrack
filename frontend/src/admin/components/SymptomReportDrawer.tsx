import { useEffect, useRef, useState } from 'react'
import {
  ADVICE_TEMPLATES,
  CONCERN_LABELS,
  FOLLOW_UP_LABELS,
  isUrgentReport,
  severityTone,
  type CheckupHistoryEntry,
  type SymptomReport,
} from '../symptomReportsConfig'
import { pushResidentNotification } from '../../shared/residentNotifications'
import '../css/accounts.css'

interface Props {
  report: SymptomReport
  pastReports: SymptomReport[]
  checkups: CheckupHistoryEntry[]
  onClose: () => void
  onUpdate: (id: number, patch: Partial<SymptomReport>, message: string) => void
  onNotice: (message: string, type?: 'success' | 'error') => void
}

type Panel = 'none' | 'schedule' | 'advice'

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** For date-only values like "2026-10-28" (no time zone shift). */
function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function todayIso(): string {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export default function SymptomReportDrawer({
  report,
  pastReports,
  checkups,
  onClose,
  onUpdate,
  onNotice,
}: Props) {
  const [panel, setPanel] = useState<Panel>('none')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [advice, setAdvice] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Close on Escape, lock the page scroll, and put focus on the close button.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])

  // Reset the inline forms when a different report is opened.
  useEffect(() => {
    setPanel('none')
    setDate('')
    setTime('')
    setAdvice('')
  }, [report.id])

  const urgent = isUrgentReport(report)
  const tone = severityTone(report)
  const notes = report.notes.trim()

  const history = [
    ...pastReports.map(item => ({
      key: `report-${item.id}`,
      kind: 'Report',
      title: CONCERN_LABELS[item.mainConcern],
      detail: `${item.severity} · ${item.status}`,
      date: item.createdAt,
    })),
    ...checkups.map(item => ({
      key: `checkup-${item.id}`,
      kind: 'Checkup',
      title: item.type,
      detail: item.status,
      date: item.date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  function scheduleCheckup() {
    if (!date || !time) {
      onNotice('Choose both a date and a time for the checkup.', 'error')
      return
    }

    const scheduledFor = new Date(`${date}T${time}`)
    if (Number.isNaN(scheduledFor.getTime())) {
      onNotice('That date and time could not be read. Please try again.', 'error')
      return
    }

    pushResidentNotification({
      residentId: report.residentId,
      kind: 'checkup',
      title: 'Checkup scheduled',
      message: `The barangay health center scheduled a checkup for you on ${formatDateTime(scheduledFor.toISOString())}.`,
      scheduledFor: scheduledFor.toISOString(),
    })

    onUpdate(
      report.id,
      { status: 'Scheduled', scheduledFor: scheduledFor.toISOString() },
      `Checkup scheduled for ${report.residentName} on ${formatDateTime(scheduledFor.toISOString())}.`,
    )
    setPanel('none')
    setDate('')
    setTime('')
  }

  function sendAdvice() {
    if (!advice.trim()) return

    pushResidentNotification({
      residentId: report.residentId,
      kind: 'advice',
      title: 'Message from the health center',
      message: advice.trim(),
    })

    onUpdate(report.id, {}, `Advice sent to ${report.residentName}.`)
    setPanel('none')
    setAdvice('')
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer sr-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="symptom-drawer-title"
        onClick={event => event.stopPropagation()}
      >
        <header className="drawer-header">
          <div>
            <h2 id="symptom-drawer-title">Symptom report</h2>
            <p>{report.residentName} · {report.area}</p>
          </div>
          <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close report">
            <CloseIcon />
          </button>
        </header>

        <div className="drawer-body sr-drawer-body">
          <div className="sr-drawer-flags">
            <span className={`sr-status is-${report.status.toLowerCase()}`}>{report.status}</span>
            <span className={`sr-severity tone-${tone}`}>{report.severity}</span>
            {urgent && <span className="sr-urgent-flag">Needs attention</span>}
          </div>

          {urgent && (
            <p className="sr-urgent-note">
              {report.mainConcern === 'breathing'
                ? 'This resident reported difficulty breathing. Contact them as soon as possible.'
                : 'This resident described severe symptoms. Contact them as soon as possible.'}
            </p>
          )}

          {report.scheduledFor && (
            <p className="sr-scheduled-note">
              Checkup scheduled for {formatDateTime(report.scheduledFor)}.
            </p>
          )}

          <section className="sr-drawer-section">
            <h3>Resident</h3>
            <dl className="detail-list">
              <div><dt>Name</dt><dd>{report.residentName}</dd></div>
              <div><dt>Area</dt><dd>{report.area}</dd></div>
              <div><dt>Contact</dt><dd>{report.contact}</dd></div>
              <div><dt>Reported</dt><dd>{formatDateTime(report.createdAt)}</dd></div>
            </dl>
          </section>

          <section className="sr-drawer-section">
            <h3>What the resident shared</h3>
            <dl className="detail-list">
              <div><dt>Main concern</dt><dd>{CONCERN_LABELS[report.mainConcern]}</dd></div>
              <div><dt>When it started</dt><dd>{formatDay(report.startDate)}</dd></div>
              <div><dt>How it feels</dt><dd>{report.severity}</dd></div>
              {Object.entries(report.followUpAnswers).map(([key, answer]) => (
                <div key={key}>
                  <dt>{FOLLOW_UP_LABELS[key] ?? key.replaceAll('_', ' ')}</dt>
                  <dd>{answer}</dd>
                </div>
              ))}
              {notes && (
                <div>
                  <dt>Anything else</dt>
                  <dd>{notes}</dd>
                </div>
              )}
            </dl>
            <p className="sr-no-diagnosis">The system only groups symptoms. It does not name a disease.</p>
          </section>

          <section className="sr-drawer-section">
            <h3>Past reports and checkups</h3>
            {history.length ? (
              <ul className="sr-history">
                {history.map(item => (
                  <li key={item.key}>
                    <span className="sr-history-kind" data-kind={item.kind.toLowerCase()}>{item.kind}</span>
                    <div className="sr-history-body">
                      <strong>{item.title}</strong>
                      <span>{item.detail} · {formatDate(item.date)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sr-empty-line">No earlier reports or checkups for this resident.</p>
            )}
          </section>
        </div>

        <footer className="drawer-footer sr-drawer-footer">
          {panel === 'schedule' && (
            <div className="sr-inline-form">
              <p className="sr-inline-title">Schedule a checkup</p>
              <div className="sr-inline-fields">
                <label>
                  Date
                  <input type="date" min={todayIso()} value={date} onChange={event => setDate(event.target.value)} />
                </label>
                <label>
                  Time
                  <input type="time" value={time} onChange={event => setTime(event.target.value)} />
                </label>
              </div>
              <div className="sr-inline-actions">
                <button className="button secondary small" onClick={() => setPanel('none')}>Cancel</button>
                <button className="button small" disabled={!date || !time} onClick={scheduleCheckup}>
                  Confirm checkup
                </button>
              </div>
            </div>
          )}

          {panel === 'advice' && (
            <div className="sr-inline-form">
              <p className="sr-inline-title">Send advice to {report.residentName.split(' ')[0]}</p>
              <div className="sr-templates">
                {ADVICE_TEMPLATES.map(template => (
                  <button key={template} type="button" className="sr-template" onClick={() => setAdvice(template)}>
                    {template}
                  </button>
                ))}
              </div>
              <label className="sr-advice-label">
                Message
                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="Write a short, friendly message…"
                  value={advice}
                  onChange={event => setAdvice(event.target.value)}
                />
              </label>
              <div className="sr-inline-actions">
                <button className="button secondary small" onClick={() => setPanel('none')}>Cancel</button>
                <button className="button small" disabled={!advice.trim()} onClick={sendAdvice}>Send advice</button>
              </div>
            </div>
          )}

          {panel === 'none' && (
            <div className="sr-drawer-actions">
              <button
                className="button small"
                disabled={report.status === 'Resolved'}
                onClick={() => setPanel('schedule')}
              >
                Schedule checkup
              </button>
              <button className="button secondary small" onClick={() => setPanel('advice')}>
                Send advice
              </button>
              <button
                className="button secondary small"
                disabled={report.status !== 'New'}
                onClick={() => onUpdate(report.id, { status: 'Reviewed' }, `${report.residentName}'s report was marked reviewed.`)}
              >
                Mark as reviewed
              </button>
              <button
                className="button secondary small"
                disabled={report.status === 'Resolved'}
                onClick={() => onUpdate(report.id, { status: 'Resolved', resolvedAt: new Date().toISOString() }, `${report.residentName}'s report was marked resolved.`)}
              >
                Mark as resolved
              </button>
            </div>
          )}
        </footer>
      </aside>
    </div>
  )
}
