import { useEffect, useState } from 'react'
import { api } from './api'
import PsgcAddressFields from './PsgcAddressFields'

const date = value => value ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const list = value => value?.data || []

function HouseholdForm({ user, save }) {
  const emptyForm = { address: '', region_code: '', region_name: '', province_code: '', province_name: '', city_municipality_code: '', city_municipality_name: '', barangay_code: '', barangay_name: '', members: [{ name: '', birth_date: '', sex: '', phone: '' }] }
  const [form, setForm] = useState(emptyForm)
  function updateMember(index, key, value) { setForm(previous => ({ ...previous, members: previous.members.map((member, position) => position === index ? { ...member, [key]: value } : member) })) }
  async function submit(event) {
    event.preventDefault()
    const members = form.members.map(member => ({ ...member, birth_date: member.birth_date || null, sex: member.sex || null, phone: member.phone || null }))
    const household = user.role === 'bhw' ? { address: form.address } : { ...form, province_code: form.province_code || null, province_name: form.province_name || null }
    if (await save('/staff/households', 'POST', { ...household, members }, 'Household and residents saved.')) setForm(emptyForm)
  }
  return <form className="panel form-stack" onSubmit={submit}><h2>Add a household</h2>{user.role === 'bhw' ? <p>Residents added here will be assigned to your barangay: {user.barangay_name}.</p> : <PsgcAddressFields value={form} onChange={location => setForm(previous => ({ ...previous, ...location }))} />}<div className="form-row"><label>House number / street <span className="optional">Optional</span><input maxLength="255" value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} /></label></div>{form.members.map((member, index) => <div className="member-fields" key={index}><h3>Resident {index + 1}</h3><div className="form-row"><label>Name<input required maxLength="255" value={member.name} onChange={event => updateMember(index, 'name', event.target.value)} /></label><label>Birth date <span className="optional">Optional</span><input type="date" value={member.birth_date} onChange={event => updateMember(index, 'birth_date', event.target.value)} /></label></div><div className="form-row"><label>Sex <span className="optional">Optional</span><select value={member.sex} onChange={event => updateMember(index, 'sex', event.target.value)}><option value="">Not recorded</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="undisclosed">Prefer not to say</option></select></label><label>Phone <span className="optional">Optional</span><input maxLength="30" value={member.phone} onChange={event => updateMember(index, 'phone', event.target.value)} /></label></div>{form.members.length > 1 && <button type="button" className="link-button" onClick={() => setForm({ ...form, members: form.members.filter((_, position) => position !== index) })}>Remove resident</button>}</div>)}<div className="actions"><button type="button" className="button secondary" disabled={form.members.length >= 10} onClick={() => setForm({ ...form, members: [...form.members, { name: '', birth_date: '', sex: '', phone: '' }] })}>Add another resident</button><button className="button">Save household</button></div></form>
}

function ResidentDetail({ resident, save }) {
  const [appointment, setAppointment] = useState({ type: 'Checkup', scheduled_for: '', notes: '' })
  const [visit, setVisit] = useState({ visited_at: '', outcome: 'completed', systolic: '', diastolic: '', temperature_c: '', notes: '', next_visit_at: '' })
  const [followUp, setFollowUp] = useState('')
  const root = `/staff/residents/${resident.id}`
  async function submitAppointment(event) { event.preventDefault(); if (await save(`${root}/appointments`, 'POST', { ...appointment, scheduled_for: new Date(appointment.scheduled_for).toISOString() }, 'Checkup scheduled.')) setAppointment({ type: 'Checkup', scheduled_for: '', notes: '' }) }
  async function submitVisit(event) {
    event.preventDefault()
    const saved = await save(`${root}/visits`, 'POST', {
      ...visit, visited_at: new Date(visit.visited_at).toISOString(), next_visit_at: visit.next_visit_at ? new Date(visit.next_visit_at).toISOString() : null,
      systolic: visit.systolic === '' ? null : Number(visit.systolic), diastolic: visit.diastolic === '' ? null : Number(visit.diastolic), temperature_c: visit.temperature_c === '' ? null : Number(visit.temperature_c),
    }, 'Visit recorded.')
    if (saved) setVisit({ visited_at: '', outcome: 'completed', systolic: '', diastolic: '', temperature_c: '', notes: '', next_visit_at: '' })
  }
  async function submitFollowUp(event) { event.preventDefault(); if (await save(`${root}/follow-ups`, 'POST', { reason: followUp }, 'Follow-up added.')) setFollowUp('') }

  return <div className="detail-stack"><section className="panel"><h2>{resident.name}</h2><p>{resident.household.barangay_name}{resident.household.address ? ` · ${resident.household.address}` : ''}</p><p>Resident record #{resident.id}</p></section><div className="content-grid"><form className="panel form-stack" onSubmit={submitAppointment}><h2>Schedule a checkup</h2><label>Type<input required maxLength="80" value={appointment.type} onChange={event => setAppointment({ ...appointment, type: event.target.value })} /></label><label>Date and time<input required type="datetime-local" value={appointment.scheduled_for} onChange={event => setAppointment({ ...appointment, scheduled_for: event.target.value })} /></label><label>Notes <span className="optional">Optional</span><textarea rows="2" value={appointment.notes} onChange={event => setAppointment({ ...appointment, notes: event.target.value })} /></label><button className="button">Save schedule</button></form><form className="panel form-stack" onSubmit={submitFollowUp}><h2>Add follow-up</h2><label>Reason<input required maxLength="255" value={followUp} onChange={event => setFollowUp(event.target.value)} /></label><button className="button">Add to queue</button></form></div><form className="panel form-stack" onSubmit={submitVisit}><h2>Record a visit</h2><div className="form-row"><label>Visit date and time<input required type="datetime-local" value={visit.visited_at} onChange={event => setVisit({ ...visit, visited_at: event.target.value })} /></label><label>Outcome<select value={visit.outcome} onChange={event => setVisit({ ...visit, outcome: event.target.value })}><option value="completed">Completed</option><option value="unable_to_contact">Unable to contact</option></select></label></div><div className="form-row three"><label>Systolic BP <span className="optional">Optional</span><input type="number" min="40" max="300" value={visit.systolic} onChange={event => setVisit({ ...visit, systolic: event.target.value })} /></label><label>Diastolic BP <span className="optional">Optional</span><input type="number" min="20" max="200" value={visit.diastolic} onChange={event => setVisit({ ...visit, diastolic: event.target.value })} /></label><label>Temperature °C <span className="optional">Optional</span><input type="number" step="0.1" min="30" max="45" value={visit.temperature_c} onChange={event => setVisit({ ...visit, temperature_c: event.target.value })} /></label></div><label>Notes <span className="optional">Optional</span><textarea rows="3" maxLength="3000" value={visit.notes} onChange={event => setVisit({ ...visit, notes: event.target.value })} /></label><label>Suggested next visit <span className="optional">Optional</span><input type="datetime-local" value={visit.next_visit_at} onChange={event => setVisit({ ...visit, next_visit_at: event.target.value })} /></label><button className="button">Save visit</button></form><section className="panel"><h2>Schedules and history</h2>{resident.appointments.length ? <ul className="plain-list">{resident.appointments.map(item => <li key={item.id}><strong>{item.type} · {item.status}</strong><span>{date(item.scheduled_for)}</span>{item.status === 'scheduled' && <div className="actions"><button className="button secondary small" onClick={() => save(`/staff/appointments/${item.id}`, 'PATCH', { status: 'completed' }, 'Appointment completed.')}>Mark completed</button><button className="button secondary small" onClick={() => save(`/staff/appointments/${item.id}`, 'PATCH', { status: 'missed' }, 'Missed appointment added to follow-up.')}>Mark missed</button></div>}</li>)}</ul> : <p className="empty">No checkups recorded.</p>}<h3>Visits</h3>{resident.visits.length ? <ul className="plain-list">{resident.visits.map(item => <li key={item.id}><strong>{date(item.visited_at)} · {item.outcome.replaceAll('_', ' ')}</strong><span>{item.notes || 'No notes'}{item.systolic ? ` · BP ${item.systolic}/${item.diastolic}` : ''}{item.temperature_c ? ` · ${item.temperature_c}°C` : ''}</span></li>)}</ul> : <p className="empty">No visits recorded.</p>}</section></div>
}

function ReviewList({ items, kind, save }) {
  const [drafts, setDrafts] = useState({})
  const isRequest = kind === 'requests'
  return <section className="panel"><h2>{isRequest ? 'Resident requests' : 'Symptom reports'}</h2>{items.length ? <ul className="plain-list">{items.map(item => <li key={item.id}><strong>{item.resident?.name} · {isRequest ? item.type.replaceAll('_', ' ') : item.category} · {item.status}</strong><span>{date(item.created_at)}</span>{isRequest ? <p>{item.details}</p> : <><p>{item.details || 'No additional details'}</p><dl className="answer-list">{Object.entries(item.answers || {}).map(([key, answer]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{answer}</dd></div>)}</dl></>}{item.status === 'pending' ? <div className="form-stack inline-form"><label>{isRequest ? 'Response to resident' : 'Review note'}<textarea rows="2" value={drafts[item.id] || ''} onChange={event => setDrafts({ ...drafts, [item.id]: event.target.value })} /></label><button className="button small" disabled={!drafts[item.id]?.trim()} onClick={() => save(isRequest ? `/staff/requests/${item.id}` : `/staff/symptom-reports/${item.id}`, 'PATCH', isRequest ? { response: drafts[item.id] } : { review_note: drafts[item.id] }, isRequest ? 'Response saved.' : 'Report reviewed.')}>{isRequest ? 'Send response' : 'Mark reviewed'}</button></div> : <span>{item.response || item.review_note}</span>}</li>)}</ul> : <p className="empty">Nothing to review.</p>}</section>
}

function FollowUps({ items, save }) {
  const [notes, setNotes] = useState({})
  return <section className="panel"><h2>Follow-up queue</h2>{items.length ? <ul className="plain-list">{items.map(item => <li key={item.id}><strong>{item.resident?.name} · {item.status}</strong><span>{item.reason}</span>{item.status === 'open' ? <div className="form-stack inline-form"><label>Action taken<textarea rows="2" value={notes[item.id] || ''} onChange={event => setNotes({ ...notes, [item.id]: event.target.value })} /></label><button className="button small" disabled={!notes[item.id]?.trim()} onClick={() => save(`/staff/follow-ups/${item.id}`, 'PATCH', { action_note: notes[item.id] }, 'Follow-up completed.')}>Complete follow-up</button></div> : <span>{item.action_note}</span>}</li>)}</ul> : <p className="empty">No follow-ups yet.</p>}</section>
}

function Announcements({ items, canCreate, save }) {
  const emptyForm = { title: '', body: '', targetBarangay: false, barangay_code: '', barangay_name: '', region_code: '', region_name: '', province_code: '', province_name: '', city_municipality_code: '', city_municipality_name: '', published_at: '', expires_at: '' }
  const [form, setForm] = useState(emptyForm)
  async function submit(event) {
    event.preventDefault()
    const payload = { ...form, barangay_code: form.targetBarangay ? form.barangay_code : null, barangay_name: form.targetBarangay ? form.barangay_name : null, published_at: new Date(form.published_at).toISOString(), expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null }
    if (await save('/staff/announcements', 'POST', payload, 'Announcement published.')) setForm(emptyForm)
  }
  return <div className="content-grid">{canCreate && <form className="panel form-stack" onSubmit={submit}><h2>Publish an announcement</h2><label>Title<input required maxLength="255" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label>Message<textarea required rows="4" maxLength="5000" value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} /></label><label className="check-label"><input type="checkbox" checked={form.targetBarangay} onChange={event => setForm({ ...form, targetBarangay: event.target.checked })} /> Send to one barangay</label>{form.targetBarangay && <PsgcAddressFields heading="Target barangay" value={form} onChange={location => setForm(previous => ({ ...previous, ...location }))} />}<div className="form-row"><label>Publish at<input required type="datetime-local" value={form.published_at} onChange={event => setForm({ ...form, published_at: event.target.value })} /></label><label>Expires at <span className="optional">Optional</span><input type="datetime-local" value={form.expires_at} onChange={event => setForm({ ...form, expires_at: event.target.value })} /></label></div><button className="button">Publish</button></form>}<section className="panel"><h2>Current announcements</h2>{items.length ? <ul className="plain-list">{items.map(item => <li key={item.id}><strong>{item.title}</strong><span>{item.body}</span><span>{item.barangay_name ? `${item.barangay_name} barangay` : 'All barangays'} · ${date(item.published_at)}</span></li>)}</ul> : <p className="empty">No announcements.</p>}</section></div>
}

function Accounts({ items, save }) {
  const [changes, setChanges] = useState({})
  return <section className="panel"><h2>Resident and BHW accounts</h2><p>Health-center staff can update account status and BHW barangay assignments. The admin creates BHW accounts.</p>{items.length ? <ul className="plain-list">{items.map(item => {
    const draft = changes[item.id] || {}
    async function updateAccount() {
      const payload = { status: draft.status || item.status }
      if (item.role === 'bhw' && draft.changeAssignment) {
        Object.assign(payload, {
          region_code: draft.region_code,
          region_name: draft.region_name,
          province_code: draft.province_code || null,
          province_name: draft.province_name || null,
          city_municipality_code: draft.city_municipality_code,
          city_municipality_name: draft.city_municipality_name,
          barangay_code: draft.barangay_code,
          barangay_name: draft.barangay_name,
        })
      }
      if (await save(`/staff/accounts/${item.id}`, 'PATCH', payload, 'Account updated.')) {
        setChanges(previous => ({ ...previous, [item.id]: {} }))
      }
    }
    return <li key={item.id}><strong>{item.name} · {item.role.replaceAll('_', ' ')}</strong><span>{item.email} · {item.status}{item.role === 'bhw' ? ` · Assigned barangay: ${item.barangay_name || 'Not recorded'}` : ''}</span><div className="form-stack inline-form"><label>Status<select value={draft.status || item.status} onChange={event => setChanges({ ...changes, [item.id]: { ...draft, status: event.target.value } })}><option value="active">Active</option><option value="suspended">Suspended</option><option value="deactivated">Deactivated</option></select></label>{item.role === 'bhw' && <><label className="check-label"><input type="checkbox" checked={Boolean(draft.changeAssignment)} onChange={event => setChanges({ ...changes, [item.id]: { ...draft, changeAssignment: event.target.checked } })} /> Change assigned barangay</label>{draft.changeAssignment && <PsgcAddressFields heading="New assigned barangay" value={draft} onChange={location => setChanges(previous => ({ ...previous, [item.id]: { ...previous[item.id], ...location } }))} />}</>}<button className="button secondary small" onClick={updateAccount}>Save changes</button></div></li>
  })}</ul> : <p className="empty">No accounts found.</p>}</section>
}

function AreaSignals({ data, save }) {
  const [rule, setRule] = useState({ category: 'fever', window_days: 7, minimum_reports: 5, enabled: false })
  const [notes, setNotes] = useState({})
  const [statuses, setStatuses] = useState({})
  async function submit(event) { event.preventDefault(); await save('/staff/area-alert-rules', 'PUT', { ...rule, window_days: Number(rule.window_days), minimum_reports: Number(rule.minimum_reports) }, 'Rule saved.') }
  return <div className="detail-stack"><section className="panel"><h2>Area trend signals</h2><p>These are report patterns for staff review. They do not confirm a disease or outbreak.</p>{!data.rules?.processing_enabled && <p className="notice">Automatic alerts are disabled in server configuration until the health team approves the process.</p>}<p>Counts show distinct residents in the last {data.trends?.window_days || 7} days; groups below {data.trends?.minimum_display_count || 5} are hidden.</p>{data.trends?.trends?.length ? <div className="table-wrap"><table><thead><tr><th>Barangay</th><th>Symptom group</th><th>Residents reporting</th></tr></thead><tbody>{data.trends.trends.map((item, index) => <tr key={index}><td>{item.barangay_name}</td><td>{item.category}</td><td>{item.resident_count}</td></tr>)}</tbody></table></div> : <p className="empty">No area counts meet the display minimum.</p>}</section><div className="content-grid"><form className="panel form-stack" onSubmit={submit}><h2>Configure review rule</h2><p>Set these values only after the health team has agreed on the category and review process.</p><label>Symptom group<select value={rule.category} onChange={event => setRule({ ...rule, category: event.target.value })}>{['fever', 'respiratory', 'stomach', 'pain', 'skin', 'other'].map(category => <option key={category}>{category}</option>)}</select></label><div className="form-row"><label>Window in days<input type="number" min="1" max="30" required value={rule.window_days} onChange={event => setRule({ ...rule, window_days: event.target.value })} /></label><label>Minimum distinct residents<input type="number" min="5" max="500" required value={rule.minimum_reports} onChange={event => setRule({ ...rule, minimum_reports: event.target.value })} /></label></div><label className="check-label"><input type="checkbox" checked={rule.enabled} onChange={event => setRule({ ...rule, enabled: event.target.checked })} /> Enable this rule</label><button className="button">Save rule</button>{data.rules?.rules?.length > 0 && <ul className="plain-list">{data.rules.rules.map(item => <li key={item.id}><strong>{item.category} · {item.enabled ? 'Enabled' : 'Disabled'}</strong><span>{item.minimum_reports} residents within {item.window_days} days</span></li>)}</ul>}</form><section className="panel"><h2>Signals to review</h2>{list(data.alerts).length ? <ul className="plain-list">{list(data.alerts).map(item => <li key={item.id}><strong>{item.barangay_name} · {item.category} · {item.status}</strong><span>{item.report_count} residents · {date(item.created_at)}</span><div className="form-stack inline-form"><label>Review note<textarea rows="2" value={notes[item.id] || ''} onChange={event => setNotes({ ...notes, [item.id]: event.target.value })} /></label><label>Outcome<select value={statuses[item.id] || 'monitoring'} onChange={event => setStatuses({ ...statuses, [item.id]: event.target.value })}><option value="monitoring">Monitor</option><option value="dismissed">Dismiss</option><option value="escalated">Escalate through approved process</option></select></label><button className="button small" disabled={!notes[item.id]?.trim()} onClick={() => save(`/staff/area-alerts/${item.id}`, 'PATCH', { status: statuses[item.id] || 'monitoring', review_note: notes[item.id] }, 'Signal review saved.')}>Save review</button></div></li>)}</ul> : <p className="empty">No signals yet.</p>}</section></div></div>
}

export default function StaffWorkspace({ user }) {
  const isCenter = user.role === 'health_center'
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState({})
  const [selectedResident, setSelectedResident] = useState(null)
  const [search, setSearch] = useState('')
  const [showHouseholdForm, setShowHouseholdForm] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function load(section = tab) {
    try {
      if (section === 'overview') { const overview = await api('/staff/dashboard'); setData(previous => ({ ...previous, overview })) }
      if (section === 'residents') { const residents = await api(`/staff/residents?search=${encodeURIComponent(search)}`); setData(previous => ({ ...previous, residents })) }
      if (section === 'followups') { const followups = await api('/staff/follow-ups'); setData(previous => ({ ...previous, followups })) }
      if (section === 'requests') { const requests = await api('/staff/requests'); setData(previous => ({ ...previous, requests })) }
      if (section === 'reports') { const reports = await api('/staff/symptom-reports'); setData(previous => ({ ...previous, reports })) }
      if (section === 'announcements') { const announcements = await api('/announcements'); setData(previous => ({ ...previous, announcements })) }
      if (section === 'signals' && isCenter) { const [alerts, rules, trends] = await Promise.all([api('/staff/area-alerts'), api('/staff/area-alert-rules'), api('/staff/area-trends')]); setData(previous => ({ ...previous, alerts, rules, trends })) }
      if (section === 'accounts' && isCenter) { const accounts = await api('/staff/accounts'); setData(previous => ({ ...previous, accounts })) }
      setError('')
    } catch (failure) { setError(failure.message) }
  }

  useEffect(() => { load(tab) }, [tab])

  async function save(path, method, body, success) {
    setError('')
    try {
      await api(path, { method, body })
      setNotice(success)
      await load(tab)
      if (selectedResident) setSelectedResident(await api(`/staff/residents/${selectedResident.id}`))
      return true
    } catch (failure) { setError(failure.message); return false }
  }

  const tabs = [['overview', 'Overview'], ['residents', 'Residents'], ['followups', 'Follow-ups'], ['requests', 'Requests'], ['reports', 'Symptom reports'], ['announcements', 'Announcements'], ...(isCenter ? [['signals', 'Area signals'], ['accounts', 'Account status']] : [])]

  return <main className="page-container workspace"><div className="workspace-heading"><h1>{isCenter ? 'Health-center workspace' : 'BHW workspace'}</h1><p>{isCenter ? 'Barangay-wide records and review' : `${user.barangay_name} records and follow-up`}</p></div><nav className="tabs" aria-label="Staff sections">{tabs.map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setSelectedResident(null); setNotice(''); setError('') }}>{label}</button>)}</nav>{notice && <p className="notice" role="status">{notice}</p>}{error && <p className="notice error" role="alert">{error}</p>}
    {tab === 'overview' && <section className="panel"><h2>Current work</h2>{data.overview ? <div className="summary-list">{[['Residents', data.overview.residents], ['Upcoming checkups', data.overview.upcoming_appointments], ['Open follow-ups', data.overview.open_follow_ups], ['Pending requests', data.overview.pending_requests], ['New symptom reports', data.overview.pending_reports], ['Visits this month', data.overview.visits_this_month]].map(([label, count]) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}</div> : <p>Loading summary…</p>}</section>}
    {tab === 'residents' && <div className="detail-stack"><div className="toolbar"><form onSubmit={event => { event.preventDefault(); load('residents') }}><label className="visually-hidden" htmlFor="resident-search">Search residents</label><input id="resident-search" type="search" placeholder="Search residents" value={search} onChange={event => setSearch(event.target.value)} /><button className="button secondary small">Search</button></form><button className="button small" onClick={() => setShowHouseholdForm(!showHouseholdForm)}>{showHouseholdForm ? 'Close form' : 'Add household'}</button></div>{showHouseholdForm && <HouseholdForm user={user} save={save} />}<div className="content-grid resident-layout"><section className="panel"><h2>Residents</h2>{list(data.residents).length ? <ul className="plain-list selectable-list">{list(data.residents).map(resident => <li key={resident.id}><button onClick={async () => { try { setSelectedResident(await api(`/staff/residents/${resident.id}`)); setError('') } catch (failure) { setError(failure.message) } }}><strong>{resident.name}</strong><span>{resident.household.barangay_name}</span></button></li>)}</ul> : <p className="empty">No residents found.</p>}</section><div>{selectedResident ? <ResidentDetail key={selectedResident.id} resident={selectedResident} save={save} /> : <section className="panel"><h2>Resident record</h2><p className="empty">Choose a resident to view schedules, visits, and follow-ups.</p></section>}</div></div></div>}
    {tab === 'followups' && <FollowUps items={list(data.followups)} save={save} />}
    {tab === 'requests' && <ReviewList items={list(data.requests)} kind="requests" save={save} />}
    {tab === 'reports' && <ReviewList items={list(data.reports)} kind="reports" save={save} />}
    {tab === 'announcements' && <Announcements items={list(data.announcements)} canCreate={isCenter} save={save} />}
    {tab === 'signals' && isCenter && <AreaSignals data={data} save={save} />}
    {tab === 'accounts' && isCenter && <Accounts items={list(data.accounts)} save={save} />}
  </main>
}
