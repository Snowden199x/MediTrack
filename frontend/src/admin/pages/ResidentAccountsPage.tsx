import { useEffect, useRef, useState } from 'react'
import '../css/accounts.css'

const fmt = (value) => value ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

interface Household {
  barangay_name: string
  city_municipality_name: string
  province_name?: string
  region_name: string
}

interface Registration {
  id: number
  name: string
  email: string
  created_at: string
  resident?: {
    age: number
    sex: string
    household?: Household
  }
}

interface Props {
  registrations: Registration[]
  loading: boolean
  busyId: number | null
  reasons: Record<number, string>
  onReasonChange: (id: number, value: string) => void
  onReview: (registration: Registration, decision: 'approve' | 'reject') => void
}

const shortLocation = (h?: Household) =>
  h ? [h.barangay_name, h.city_municipality_name, h.province_name].filter(Boolean).join(', ') : '—'

const fullLocation = (h?: Household) =>
  h ? [h.barangay_name, h.city_municipality_name, h.province_name, h.region_name].filter(Boolean).join(', ') : '—'

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

interface DrawerProps {
  registration: Registration
  reason: string
  busy: boolean
  onReasonChange: (value: string) => void
  onReview: (decision: 'approve' | 'reject') => void
  onClose: () => void
}

function DetailsDrawer({ registration: r, reason, busy, onReasonChange, onReview, onClose }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Focus the close button, close on Escape, lock page scroll, and give focus back when closed.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={e => e.stopPropagation()}
      >
        <header className="drawer-header">
          <div>
            <h2 id="drawer-title">Account details</h2>
            <p>Pending approval</p>
          </div>
          <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close details">
            <CloseIcon />
          </button>
        </header>

        <div className="drawer-body">
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{r.name}</dd></div>
            <div><dt>Email</dt><dd>{r.email}</dd></div>
            <div><dt>Age</dt><dd>{r.resident ? r.resident.age : '—'}</dd></div>
            <div><dt>Sex</dt><dd>{r.resident?.sex || '—'}</dd></div>
            <div><dt>Location</dt><dd>{fullLocation(r.resident?.household)}</dd></div>
            <div><dt>Submitted</dt><dd>{fmt(r.created_at)}</dd></div>
          </dl>
        </div>

        <footer className="drawer-footer">
          <label htmlFor="reject-reason">
            Rejection reason <span>(required to reject)</span>
          </label>
          <textarea
            id="reject-reason"
            maxLength={1000}
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
          />
          <div className="account-actions">
            <button
              className="button secondary small"
              disabled={busy || !reason.trim()}
              onClick={() => onReview('reject')}
            >
              Reject
            </button>
            <button
              className="button small"
              disabled={busy}
              onClick={() => onReview('approve')}
            >
              {busy ? '…' : 'Approve'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

export default function ResidentAccountsPage({
  registrations,
  loading,
  busyId,
  reasons,
  onReasonChange,
  onReview,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // If the account is approved or rejected, it leaves the list and the panel closes by itself.
  const selected = registrations.find(r => r.id === selectedId) ?? null

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1>Resident accounts</h1>
        <p>Review and approve pending registrations.</p>
      </div>

      {loading ? (
        <p className="loading" role="status">Loading…</p>
      ) : registrations.length > 0 ? (
        <section className="panel">
          <div className="toolbar" style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>
              Pending approvals
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '22px',
                height: '22px',
                padding: '0 6px',
                borderRadius: '999px',
                background: '#e63946',
                color: '#fff',
                fontSize: '.72rem',
                fontWeight: 700,
                marginLeft: '8px',
                verticalAlign: 'middle',
              }}>
                {registrations.length}
              </span>
            </h2>
          </div>

          <div className="approvals-table-wrap">
            <table className="approvals-table">
              <thead>
                <tr>
                  <th className="col-name">Name</th>
                  <th className="col-email">Email</th>
                  <th className="col-age">Age / Sex</th>
                  <th className="col-loc">Location</th>
                  <th className="col-date">Submitted</th>
                  <th className="col-actions"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(r => {
                  const age = r.resident ? `${r.resident.age} · ${r.resident.sex}` : '—'
                  const loc = shortLocation(r.resident?.household)
                  return (
                    <tr key={r.id}>
                      <td className="col-name" title={r.name}><strong>{r.name}</strong></td>
                      <td className="col-email" title={r.email}>{r.email}</td>
                      <td className="col-age" title={age}>{age}</td>
                      <td className="col-loc" title={loc}>{loc}</td>
                      <td className="col-date">{fmt(r.created_at)}</td>
                      <td className="col-actions">
                        <button
                          className="icon-button"
                          aria-label={`View details for ${r.name}`}
                          title="View details"
                          onClick={() => setSelectedId(r.id)}
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
        </section>
      ) : (
        <p className="empty">No pending approvals.</p>
      )}

      {selected && (
        <DetailsDrawer
          registration={selected}
          reason={reasons[selected.id] || ''}
          busy={busyId === selected.id}
          onReasonChange={value => onReasonChange(selected.id, value)}
          onReview={decision => onReview(selected, decision)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}