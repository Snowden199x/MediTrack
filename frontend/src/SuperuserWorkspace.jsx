import { useEffect, useState } from 'react'
import { api } from './api'
import PsgcAddressFields from './PsgcAddressFields'

const date = value => value ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const emptyBhwForm = { name: '', email: '', address: '', region_code: '', region_name: '', province_code: '', province_name: '', city_municipality_code: '', city_municipality_name: '', barangay_code: '', barangay_name: '', password: '', password_confirmation: '' }

export default function SuperuserWorkspace({ user }) {
  const [registrations, setRegistrations] = useState([])
  const [bhwAccounts, setBhwAccounts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [accountCounts, setAccountCounts] = useState({ residents: 0, bhw: 0, pending: 0, archived: 0 })
  const [accountPage, setAccountPage] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [accountFilters, setAccountFilters] = useState({ search: '', role: '', status: '' })
  const [accountQuery, setAccountQuery] = useState({ search: '', role: '', status: '', page: 1 })
  const [editingAccount, setEditingAccount] = useState(null)
  const [accountDraft, setAccountDraft] = useState({ name: '', email: '' })
  const [reasons, setReasons] = useState({})
  const [section, setSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [bhwLoading, setBhwLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [creatingBhw, setCreatingBhw] = useState(false)
  const [bhwForm, setBhwForm] = useState(emptyBhwForm)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function refreshAccounts(query = accountQuery) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => { if (value) params.set(key, value) })
    const result = await api(`/admin/accounts?${params.toString()}`)
    setAccounts(result.accounts.data || [])
    setAccountPage(result.accounts)
    setAccountCounts(result.counts)
  }

  async function refresh() {
    try {
      const result = await api('/admin/registrations')
      setRegistrations(result.data || [])
      setError('')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setLoading(false)
    }
  }

  async function refreshBhwAccounts() {
    try {
      const result = await api('/admin/bhw-accounts')
      setBhwAccounts(result.data || [])
      setError('')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBhwLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadRegistrations() {
      try {
        const result = await api('/admin/registrations')
        if (isMounted) {
          setRegistrations(result.data || [])
          setError('')
        }
      } catch (failure) {
        if (isMounted) setError(failure.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadRegistrations()

    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadAccounts() {
      try {
        const params = new URLSearchParams()
        Object.entries(accountQuery).forEach(([key, value]) => { if (value) params.set(key, value) })
        const result = await api(`/admin/accounts?${params.toString()}`)
        if (isMounted) {
          setAccounts(result.accounts.data || [])
          setAccountPage(result.accounts)
          setAccountCounts(result.counts)
          setError('')
        }
      } catch (failure) { if (isMounted) setError(failure.message) }
    }
    void loadAccounts()
    return () => { isMounted = false }
  }, [accountQuery])

  useEffect(() => {
    let isMounted = true

    async function loadBhwAccounts() {
      try {
        const result = await api('/admin/bhw-accounts')
        if (isMounted) {
          setBhwAccounts(result.data || [])
          setError('')
        }
      } catch (failure) {
        if (isMounted) setError(failure.message)
      } finally {
        if (isMounted) setBhwLoading(false)
      }
    }

    void loadBhwAccounts()

    return () => { isMounted = false }
  }, [])

  async function createBhwAccount(event) {
    event.preventDefault()
    setCreatingBhw(true)
    setNotice('')
    setError('')
    try {
      const result = await api('/admin/bhw-accounts', {
        method: 'POST',
        body: {
          ...bhwForm,
          province_code: bhwForm.province_code || null,
          province_name: bhwForm.province_name || null,
          address: bhwForm.address || null,
        },
      })
      setNotice(`${result.name} was added as a BHW for ${result.barangay_name}.`)
      setBhwForm(emptyBhwForm)
      await refreshBhwAccounts()
      await refreshAccounts()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setCreatingBhw(false)
    }
  }

  async function review(registration, decision) {
    setBusyId(registration.id)
    setNotice('')
    setError('')
    try {
      await api(`/admin/registrations/${registration.id}`, {
        method: 'PATCH',
        body: { decision, rejection_reason: reasons[registration.id] || '' },
      })
      setNotice(decision === 'approve' ? `${registration.name} was approved.` : `${registration.name}'s registration was rejected.`)
      setReasons(previous => {
        const next = { ...previous }
        delete next[registration.id]
        return next
      })
      await refresh()
      await refreshAccounts()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusyId(null)
    }
  }

  async function saveAccount(event) {
    event.preventDefault()
    setBusyId(editingAccount.id)
    setError('')
    setNotice('')
    try {
      await api(`/admin/accounts/${editingAccount.id}`, { method: 'PATCH', body: accountDraft })
      setNotice(`${accountDraft.name} account details updated.`)
      setEditingAccount(null)
      await refreshAccounts()
    } catch (failure) { setError(failure.message) }
    finally { setBusyId(null) }
  }

  async function changeAccountState(account, action) {
    const isDelete = action === 'delete'
    const prompt = isDelete
      ? `Permanently delete ${account.name}'s account? Existing resident health records will be retained.`
      : action === 'archive'
        ? `Archive ${account.name}'s account? They will lose access and can be restored later.`
        : `Restore ${account.name}'s account?`
    if (!window.confirm(prompt)) return
    setBusyId(account.id)
    setError('')
    setNotice('')
    try {
      if (isDelete) await api(`/admin/accounts/${account.id}`, { method: 'DELETE' })
      else await api(`/admin/accounts/${account.id}/${action}`, { method: 'POST' })
      setNotice(isDelete ? `${account.name}'s account was deleted.` : `${account.name}'s account was ${action === 'archive' ? 'archived' : 'restored'}.`)
      await refreshAccounts()
    } catch (failure) { setError(failure.message) }
    finally { setBusyId(null) }
  }

  function runAccountFilter(event) {
    event.preventDefault()
    const query = { ...accountFilters, page: 1 }
    setAccountQuery(query)
  }

  return <main className="page-container workspace">
    <div className="workspace-heading">
      <h1>Admin dashboard</h1>
      <p>Signed in as {user.name}. Review registrations and manage resident and BHW accounts.</p>
    </div>
    {notice && <p className="notice" role="status">{notice}</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    <nav className="tabs" aria-label="Admin account sections">
      <button className={section === 'overview' ? 'active' : ''} onClick={() => setSection('overview')}>Dashboard</button>
      <button className={section === 'accounts' ? 'active' : ''} onClick={() => setSection('accounts')}>All accounts</button>
      <button className={section === 'registrations' ? 'active' : ''} onClick={() => setSection('registrations')}>Resident registrations</button>
      <button className={section === 'bhw' ? 'active' : ''} onClick={() => setSection('bhw')}>Create BHW</button>
    </nav>
    {section === 'overview' ? <div className="admin-count-grid" aria-label="Account totals">
      {[['Resident accounts', accountCounts.residents], ['BHW accounts', accountCounts.bhw], ['Waiting for approval', accountCounts.pending], ['Archived accounts', accountCounts.archived]].map(([label, count]) => <article className="admin-count-card" key={label}><span>{label}</span><strong>{count}</strong></article>)}
      <section className="panel admin-overview-list"><div className="toolbar"><h2>Recent accounts</h2><button className="button secondary small" onClick={() => setSection('accounts')}>Manage accounts</button></div>{accounts.length ? <ul className="plain-list">{accounts.slice(0, 8).map(account => <li key={account.id}><strong>{account.name} · {account.role === 'bhw' ? 'BHW' : 'Resident'} · {account.status}</strong><span>{account.email}{account.barangay_name ? ` · ${account.barangay_name}` : ''} · Created {date(account.created_at)}</span></li>)}</ul> : <p className="empty">No resident or BHW accounts yet.</p>}</section>
    </div> : section === 'accounts' ? <section className="panel">
      <div className="toolbar"><div><h2>Resident and BHW accounts</h2><p>Search and manage existing accounts. Archived accounts can be restored or permanently deleted.</p></div></div>
      <form className="toolbar account-filter" onSubmit={runAccountFilter}>
        <label className="visually-hidden" htmlFor="account-search">Search accounts</label><input id="account-search" placeholder="Search name, email, or barangay" value={accountFilters.search} onChange={event => setAccountFilters({ ...accountFilters, search: event.target.value })} />
        <label className="visually-hidden" htmlFor="account-role">Role</label><select id="account-role" value={accountFilters.role} onChange={event => setAccountFilters({ ...accountFilters, role: event.target.value })}><option value="">All roles</option><option value="resident">Resident</option><option value="bhw">BHW</option></select>
        <label className="visually-hidden" htmlFor="account-status">Status</label><select id="account-status" value={accountFilters.status} onChange={event => setAccountFilters({ ...accountFilters, status: event.target.value })}><option value="">All statuses</option>{['pending', 'active', 'rejected', 'suspended', 'deactivated', 'archived'].map(status => <option key={status} value={status}>{status}</option>)}</select>
        <button className="button small">Search</button>
      </form>
      {accounts.length ? <div className="table-wrap"><table><thead><tr><th>Account</th><th>Role</th><th>Status</th><th>Barangay</th><th>Created</th><th>Actions</th></tr></thead><tbody>{accounts.map(account => <tr key={account.id}><td><strong>{account.name}</strong><br />{account.email}</td><td>{account.role === 'bhw' ? 'BHW' : 'Resident'}</td><td>{account.status}</td><td>{account.barangay_name || '—'}</td><td>{date(account.created_at)}</td><td><div className="account-actions"><button className="button secondary small" disabled={account.status === 'archived'} onClick={() => { setEditingAccount(account); setAccountDraft({ name: account.name, email: account.email }) }}>Edit</button>{account.status === 'archived' ? <><button className="button small" disabled={busyId === account.id} onClick={() => changeAccountState(account, 'restore')}>Restore</button><button className="button danger small" disabled={busyId === account.id} onClick={() => changeAccountState(account, 'delete')}>Delete</button></> : account.status !== 'pending' && <button className="button secondary small" disabled={busyId === account.id} onClick={() => changeAccountState(account, 'archive')}>Archive</button>}</div></td></tr>)}</tbody></table></div> : <p className="empty">No accounts match these filters.</p>}
      <div className="account-pagination"><span>{accountPage.total || 0} accounts · Page {accountPage.current_page || 1} of {accountPage.last_page || 1}</span><div><button className="button secondary small" disabled={(accountPage.current_page || 1) <= 1} onClick={() => setAccountQuery({ ...accountQuery, page: accountPage.current_page - 1 })}>Previous</button><button className="button secondary small" disabled={(accountPage.current_page || 1) >= (accountPage.last_page || 1)} onClick={() => setAccountQuery({ ...accountQuery, page: accountPage.current_page + 1 })}>Next</button></div></div>
      {editingAccount && <div className="account-edit-backdrop" role="presentation" onClick={event => { if (event.target === event.currentTarget) setEditingAccount(null) }}><form className="panel account-edit-dialog form-stack" role="dialog" aria-modal="true" aria-labelledby="edit-account-title" onSubmit={saveAccount}><h2 id="edit-account-title">Edit account</h2><label>Name<input required maxLength="255" value={accountDraft.name} onChange={event => setAccountDraft({ ...accountDraft, name: event.target.value })} /></label><label>Email<input required type="email" maxLength="255" value={accountDraft.email} onChange={event => setAccountDraft({ ...accountDraft, email: event.target.value })} /></label><div className="account-actions"><button type="button" className="button secondary" onClick={() => setEditingAccount(null)}>Cancel</button><button className="button" disabled={busyId === editingAccount.id}>{busyId === editingAccount.id ? 'Saving…' : 'Save changes'}</button></div></form></div>}
    </section> : section === 'registrations' ? <section className="panel">
      <h2>Waiting for review</h2>
      {loading ? <p>Loading registrations…</p> : registrations.length ? <ul className="plain-list registration-list">
        {registrations.map(registration => <li key={registration.id}>
          <strong>{registration.name}</strong>
          <span>{registration.email} · {registration.resident?.household?.barangay_name || 'Barangay not recorded'} · Submitted {date(registration.created_at)}</span>
          {registration.resident && <span>Age {registration.resident.age} · {registration.resident.sex}</span>}
          {registration.resident?.household && <span>{registration.resident.household.barangay_name}, {registration.resident.household.city_municipality_name}{registration.resident.household.province_name ? `, ${registration.resident.household.province_name}` : ''}, {registration.resident.household.region_name}{registration.resident.household.address ? ` · ${registration.resident.household.address}` : ''}</span>}
          <div className="registration-actions">
            <button className="button small" disabled={busyId === registration.id} onClick={() => review(registration, 'approve')}>Approve</button>
            <label>Reason for rejection
              <input maxLength="1000" value={reasons[registration.id] || ''} onChange={event => setReasons(previous => ({ ...previous, [registration.id]: event.target.value }))} />
            </label>
            <button className="button secondary small" disabled={busyId === registration.id || !reasons[registration.id]?.trim()} onClick={() => review(registration, 'reject')}>Reject</button>
          </div>
        </li>)}
      </ul> : <p className="empty">No registrations are waiting for review.</p>}
    </section> : <div className="content-grid">
      <form className="panel form-stack" onSubmit={createBhwAccount}>
        <h2>Create a BHW account</h2>
        <p>The admin creates the account and assigns one barangay. Share the initial password with them privately.</p>
        <label>Full name<input required maxLength="255" value={bhwForm.name} onChange={event => setBhwForm({ ...bhwForm, name: event.target.value })} /></label>
        <label>Email<input required type="email" autoComplete="email" maxLength="255" value={bhwForm.email} onChange={event => setBhwForm({ ...bhwForm, email: event.target.value })} /></label>
        <label>House number / street <span className="optional">Optional</span><input maxLength="255" autoComplete="street-address" value={bhwForm.address} onChange={event => setBhwForm({ ...bhwForm, address: event.target.value })} /></label>
        <PsgcAddressFields heading="Assigned barangay" value={bhwForm} onChange={location => setBhwForm(previous => ({ ...previous, ...location }))} />
        <div className="form-row">
          <label>Initial password<input required type="password" autoComplete="new-password" minLength="8" value={bhwForm.password} onChange={event => setBhwForm({ ...bhwForm, password: event.target.value })} /></label>
          <label>Confirm password<input required type="password" autoComplete="new-password" minLength="8" value={bhwForm.password_confirmation} onChange={event => setBhwForm({ ...bhwForm, password_confirmation: event.target.value })} /></label>
        </div>
        <button className="button" disabled={creatingBhw}>{creatingBhw ? 'Creating…' : 'Create BHW account'}</button>
      </form>
      <section className="panel">
        <h2>BHW accounts</h2>
        {bhwLoading ? <p>Loading BHW accounts…</p> : bhwAccounts.length ? <ul className="plain-list">{bhwAccounts.map(account => <li key={account.id}><strong>{account.name} · {account.status}</strong><span>{account.email} · Assigned barangay: {account.barangay_name}, {account.city_municipality_name}{account.province_name ? `, ${account.province_name}` : ''}, {account.region_name}</span>{account.address && <span>{account.address}</span>}<span>Created {date(account.created_at)}</span></li>)}</ul> : <p className="empty">No BHW accounts have been created.</p>}
      </section>
    </div>}
  </main>
}
