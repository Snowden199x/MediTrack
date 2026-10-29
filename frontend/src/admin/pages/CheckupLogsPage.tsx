import Badge from '../../shared/Badge'
import PsgcAddressFields from '../../shared/PsgcAddressFields'
import { api } from '../../shared/api'
import { useEffect, useState } from 'react'

const fmt = (value) => value ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const emptyBhwForm = {
  name: '', email: '', address: '',
  region_code: '', region_name: '',
  province_code: '', province_name: '',
  city_municipality_code: '', city_municipality_name: '',
  barangay_code: '', barangay_name: '',
  password: '', password_confirmation: '',
}

interface Props {
  onNotice: (msg: string) => void
  onError: (msg: string) => void
}

export default function CheckupLogsPage({ onNotice, onError }: Props) {
  const [bhwAccounts, setBhwAccounts] = useState([])
  const [bhwLoading, setBhwLoading] = useState(true)
  const [creatingBhw, setCreatingBhw] = useState(false)
  const [bhwForm, setBhwForm] = useState(emptyBhwForm)

  useEffect(() => {
    let ok = true
    async function load() {
      try {
        const r = await api('/admin/bhw-accounts')
        if (ok) setBhwAccounts(r.data || [])
      } catch (e: any) { if (ok) onError(e.message) }
      finally { if (ok) setBhwLoading(false) }
    }
    void load()
    return () => { ok = false }
  }, [])

  async function createBhwAccount(event) {
    event.preventDefault()
    setCreatingBhw(true)
    try {
      const r = await api('/admin/bhw-accounts', {
        method: 'POST',
        body: {
          ...bhwForm,
          province_code: bhwForm.province_code || null,
          province_name: bhwForm.province_name || null,
          address: bhwForm.address || null,
        },
      })
      onNotice(`${r.name} was added as a BHW for ${r.barangay_name}.`)
      setBhwForm(emptyBhwForm)
      const result = await api('/admin/bhw-accounts')
      setBhwAccounts(result.data || [])
    } catch (e: any) { onError(e.message) }
    finally { setCreatingBhw(false) }
  }

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1>Checkup logs</h1>
        <p>Create BHW accounts and view BHW roster.</p>
      </div>

      <div className="content-grid">
        <form className="panel form-stack" onSubmit={createBhwAccount}>
          <h2>Create a BHW account</h2>
          <p>The admin creates the account and assigns one barangay. Share the initial password with them privately.</p>
          <label>Full name<input required maxLength={255} value={bhwForm.name} onChange={e => setBhwForm({ ...bhwForm, name: e.target.value })} /></label>
          <label>Email<input required type="email" autoComplete="email" maxLength={255} value={bhwForm.email} onChange={e => setBhwForm({ ...bhwForm, email: e.target.value })} /></label>
          <label>House / street <span className="optional">Optional</span><input maxLength={255} autoComplete="street-address" value={bhwForm.address} onChange={e => setBhwForm({ ...bhwForm, address: e.target.value })} /></label>
          <PsgcAddressFields heading="Assigned barangay" value={bhwForm} onChange={loc => setBhwForm(p => ({ ...p, ...loc }))} />
          <div className="form-row">
            <label>Initial password<input required type="password" autoComplete="new-password" minLength={8} value={bhwForm.password} onChange={e => setBhwForm({ ...bhwForm, password: e.target.value })} /></label>
            <label>Confirm password<input required type="password" autoComplete="new-password" minLength={8} value={bhwForm.password_confirmation} onChange={e => setBhwForm({ ...bhwForm, password_confirmation: e.target.value })} /></label>
          </div>
          <button className="button" disabled={creatingBhw}>{creatingBhw ? 'Creating…' : 'Create BHW account'}</button>
        </form>

        <section className="panel">
          <h2>BHW accounts</h2>
          {bhwLoading ? (
            <p className="loading" role="status">Loading…</p>
          ) : bhwAccounts.length ? (
            <ul className="plain-list">
              {bhwAccounts.map((a: any) => (
                <li key={a.id}>
                  <strong>{a.name}<Badge value={a.status} /></strong>
                  <span>{a.email} · {a.barangay_name}, {a.city_municipality_name}{a.province_name ? `, ${a.province_name}` : ''}, {a.region_name}</span>
                  {a.address && <span>{a.address}</span>}
                  <span>Created {fmt(a.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">No BHW accounts have been created.</p>
          )}
        </section>
      </div>
    </div>
  )
}
