import { useEffect, useRef, useState } from 'react'
import { api } from '../../shared/api'
import '../css/accounts.css'
import '../css/dashboard.css'

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

interface Account {
  id: number
  name: string
  email: string
  role: string
  status: string
  created_at: string
  barangay_name?: string
  city_municipality_name?: string
  province_name?: string
  region_name?: string
  resident?: { age?: number; sex?: string }
}

interface Counts {
  residents: number
  pending: number
  archived: number
  bhw: number
  rejected: number
}

type FilterKey = 'active' | 'pending' | 'rejected' | 'archived'

interface Props {
  registrations: Registration[]
  loading: boolean
  busyId: number | null
  reasons: Record<number, string>
  counts: Counts
  onReasonChange: (id: number, value: string) => void
  onReview: (registration: Registration, decision: 'approve' | 'reject') => void
}

const shortLocation = (h?: Household | Partial<Account>) =>
  h ? [
    (h as Household).barangay_name ?? (h as Account).barangay_name,
    (h as Household).city_municipality_name ?? (h as Account).city_municipality_name,
    (h as Household).province_name ?? (h as Account).province_name,
  ].filter(Boolean).join(', ') : '—'

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
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onClick={e => e.stopPropagation()}>
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
          <textarea id="reject-reason" maxLength={1000} value={reason} onChange={e => onReasonChange(e.target.value)} />
          <div className="account-actions">
            <button className="button secondary small" disabled={busy || !reason.trim()} onClick={() => onReview('reject')}>Reject</button>
            <button className="button small" disabled={busy} onClick={() => onReview('approve')}>{busy ? '…' : 'Approve'}</button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

const TABLE_TITLES: Record<FilterKey, string> = {
  active: 'Active residents',
  pending: 'Pending approvals',
  rejected: 'Declined registrations',
  archived: 'Archived accounts',
}

export default function ResidentAccountsPage({
  registrations,
  loading,
  busyId,
  reasons,
  counts,
  onReasonChange,
  onReview,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null)
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [filterLoading, setFilterLoading] = useState(false)

  const selected = registrations.find(r => r.id === selectedId) ?? null

  async function loadFilter(filter: FilterKey) {
    if (activeFilter === filter) {
      // toggle off — clicking the same card again hides the table
      setActiveFilter(null)
      setFilteredAccounts([])
      return
    }
    setActiveFilter(filter)
    setFilterLoading(true)
    try {
      const statusMap: Record<FilterKey, string> = {
        active: 'active',
        pending: 'pending',
        rejected: 'rejected',
        archived: 'archived',
      }
      const res = await api(`/admin/accounts?status=${statusMap[filter]}&role=resident`)
      setFilteredAccounts(res.accounts?.data || [])
    } catch {
      setFilteredAccounts([])
    } finally {
      setFilterLoading(false)
    }
  }

  const statCards: { label: string; value: number; hint: string; tone: string; filter: FilterKey; icon: React.ReactNode }[] = [
    {
      label: 'Total residents',
      value: counts.residents,
      hint: 'Approved accounts',
      tone: 'brand',
      filter: 'active',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Pending approval',
      value: counts.pending,
      hint: 'Awaiting review',
      tone: 'teal',
      filter: 'pending',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      label: 'Declined',
      value: counts.rejected,
      hint: 'Registration rejected',
      tone: 'red',
      filter: 'rejected',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
        </svg>
      ),
    },
    {
      label: 'Archived',
      value: counts.archived,
      hint: 'Suspended or deactivated',
      tone: 'deep',
      filter: 'archived',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
        </svg>
      ),
    },
  ]

  // Import React for ReactNode type
  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1>Resident accounts</h1>
        <p>Click a card to view that group of residents.</p>
      </div>

      {/* Stat cards — clickable */}
      <div className="accounts-stat-grid">
        {statCards.map(({ label, value, hint, tone, filter, icon }) => {
          const isActive = activeFilter === filter
          return (
            <article
              key={label}
              className={`dash-stat-card tone-${tone} accounts-stat-card${isActive ? ' is-selected' : ''}`}
              onClick={() => loadFilter(filter)}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadFilter(filter) } }}
            >
              <span className="dash-stat-icon">{icon}</span>
              <div className="dash-stat-body">
                <span className="dash-stat-label">{label}</span>
                <strong>{value.toLocaleString('en-PH')}</strong>
                <span className="dash-stat-hint">{hint}</span>
              </div>
              {isActive && <span className="accounts-card-active-dot" aria-hidden="true" />}
            </article>
          )
        })}
      </div>

      {/* Filtered table — shown when a card is active */}
      {activeFilter && (
        <section className="panel accounts-filtered-panel">
          <div className="accounts-panel-header">
            <h2>{TABLE_TITLES[activeFilter]}</h2>
            <button className="button secondary small" onClick={() => { setActiveFilter(null); setFilteredAccounts([]) }}>
              Clear filter
            </button>
          </div>

          {filterLoading ? (
            <p className="loading" role="status">Loading…</p>
          ) : filteredAccounts.length === 0 ? (
            <p className="empty">No accounts in this group.</p>
          ) : (
            <div className="approvals-table-wrap">
              <table className="approvals-table">
                <thead>
                  <tr>
                    <th className="col-name">Name</th>
                    <th className="col-email">Email</th>
                    <th className="col-age">Age / Sex</th>
                    <th className="col-loc">Location</th>
                    <th className="col-date">{activeFilter === 'pending' ? 'Submitted' : 'Registered'}</th>
                    {activeFilter === 'pending' && <th className="col-actions"><span className="sr-only">View</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(a => {
                    const ageSex = a.resident ? [a.resident.age, a.resident.sex].filter(Boolean).join(' · ') : '—'
                    const loc = [a.barangay_name, a.city_municipality_name, a.province_name].filter(Boolean).join(', ') || '—'
                    // find matching pending registration for the view button
                    const pendingReg = activeFilter === 'pending' ? registrations.find(r => r.id === a.id) : null
                    return (
                      <tr key={a.id}>
                        <td className="col-name" title={a.name}><strong>{a.name}</strong></td>
                        <td className="col-email" title={a.email}>{a.email}</td>
                        <td className="col-age">{ageSex}</td>
                        <td className="col-loc" title={loc}>{loc}</td>
                        <td className="col-date">{fmt(a.created_at)}</td>
                        {activeFilter === 'pending' && (
                          <td className="col-actions">
                            {pendingReg && (
                              <button
                                className="icon-button"
                                aria-label={`View details for ${a.name}`}
                                title="View details"
                                onClick={() => setSelectedId(a.id)}
                              >
                                <EyeIcon />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Default pending approvals table (shown when no card is active) */}
      {!activeFilter && (
        loading ? (
          <p className="loading" role="status">Loading…</p>
        ) : registrations.length > 0 ? (
          <section className="panel">
            <div className="accounts-panel-header">
              <h2>
                Pending approvals
                <span className="accounts-pending-badge">{registrations.length}</span>
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
                          <button className="icon-button" aria-label={`View details for ${r.name}`} title="View details" onClick={() => setSelectedId(r.id)}>
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
        )
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
