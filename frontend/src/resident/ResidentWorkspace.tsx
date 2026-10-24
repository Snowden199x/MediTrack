import { useEffect, useState } from 'react'
import { api } from '../shared/api'
import PsgcAddressFields from '../shared/PsgcAddressFields'
import Badge from '../shared/Badge'
import './resident.css'

function date(value) { return value ? new Date(value).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—' }

export default function ResidentWorkspace({ user, onRefreshUser }) {
  const [tab, setTab] = useState('overview')
  const [dashboard, setDashboard] = useState(null)
  const [questionnaire, setQuestionnaire] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [profile, setProfile] = useState({ address: '', region_code: '', region_name: '', province_code: '', province_name: '', city_municipality_code: '', city_municipality_name: '', barangay_code: '', barangay_name: '' })
  const [requestForm, setRequestForm] = useState({ type: 'assistance', details: '' })
  const [report, setReport] = useState({ category: '', onset_date: '', severity: 'unsure', details: '', answers: {} })
  const [nextStep, setNextStep] = useState('')

  async function refresh() {
    try {
      const [data, questions] = await Promise.all([api('/resident/dashboard'), api('/resident/symptom-questions')])
      setDashboard(data)
      setQuestionnaire(questions)
      setError('')
    } catch (failure) { setError(failure.message) }
  }

  useEffect(() => { refresh() }, [])

  async function submit(event, path, body, success) {
    event.preventDefault()
    setError('')
    try { const result = await api(path, { method: 'POST', body }); await success(result); await refresh() }
    catch (failure) { setError(failure.message) }
  }

  if (!dashboard) return <main className="page-container workspace"><p className="loading" role="status">Loading your information…</p>{error && <p className="notice error" role="alert">{error}</p>}</main>

  if (dashboard.needs_profile) return <main className="page-container workspace narrow"><h1>Complete your resident profile</h1><p>Choose your address before sending reports.</p><form className="form-stack" onSubmit={event => submit(event, '/resident/profile', { ...profile, province_code: profile.province_code || null, province_name: profile.province_name || null, address: profile.address || null }, async () => { await onRefreshUser(); setNotice('Profile completed.') })}><PsgcAddressFields value={profile} onChange={location => setProfile(previous => ({ ...previous, ...location }))} /><label>House number / street <span className="optional">Optional</span><input maxLength={255} value={profile.address} onChange={event => setProfile({ ...profile, address: event.target.value })} /></label>{error && <p className="notice error">{error}</p>}<button className="button">Save profile</button></form></main>

  const categories = (questionnaire?.categories || {}) as Record<string, { label: string; questions: Array<{ key: string; label: string; type: string; options: string[] }> }>
  const questions = categories[report.category]?.questions || []

  return <main className="page-container workspace"><div className="workspace-heading"><h1>Welcome, {user.name}</h1><p>{dashboard.resident.household.barangay_name} · Your health-center information</p></div>
    <nav className="tabs" aria-label="Resident sections">{[['overview', 'Overview'], ['report', 'Report symptoms'], ['requests', 'Requests']].map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setError(''); setNotice('') }}>{label}</button>)}</nav>
    {notice && <p className="notice" role="status">{notice}</p>}{error && <p className="notice error" role="alert">{error}</p>}
    {tab === 'overview' && <div className="content-grid"><section className="panel"><h2>Upcoming checkups</h2>{dashboard.appointments.length ? <ul className="plain-list">{dashboard.appointments.map(item => <li key={item.id}><strong>{item.type}</strong><span>{date(item.scheduled_for)}<Badge value={item.status} /></span></li>)}</ul> : <p className="empty">No checkups have been scheduled yet.</p>}</section><section className="panel"><h2>Announcements</h2>{dashboard.announcements.length ? <ul className="plain-list">{dashboard.announcements.map(item => <li key={item.id}><strong>{item.title}</strong><span>{item.body}</span></li>)}</ul> : <p className="empty">No announcements right now.</p>}</section><section className="panel full"><h2>Recent symptom reports</h2>{dashboard.symptom_reports.length ? <ul className="plain-list">{dashboard.symptom_reports.map(item => <li key={item.id}><strong>{categories[item.category]?.label || item.category}</strong><span>{date(item.created_at)}<Badge value={item.status} /></span>{item.review_note && <span>Health team: {item.review_note}</span>}</li>)}</ul> : <p className="empty">You have not sent a symptom report.</p>}</section></div>}
    {tab === 'report' && <div className="form-page"><h2>Describe what you are feeling</h2><p>These questions help the health team understand your concern. They do not identify a disease.</p><form className="form-stack" onSubmit={event => submit(event, '/resident/symptom-reports', { ...report, onset_date: report.onset_date || null }, async result => { setNextStep(result.next_step); setReport({ category: '', onset_date: '', severity: 'unsure', details: '', answers: {} }); setNotice('Your report was sent.') })}><label>Main concern<select required value={report.category} onChange={event => setReport({ ...report, category: event.target.value, answers: {} })}><option value="">Choose one</option>{Object.entries(categories).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><div className="form-row"><label>When did it start? <span className="optional">Optional</span><input type="date" value={report.onset_date} onChange={event => setReport({ ...report, onset_date: event.target.value })} /></label><label>How does it feel to you?<select value={report.severity} onChange={event => setReport({ ...report, severity: event.target.value })}><option value="unsure">Not sure</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></label></div>{questions.map((question, index) => <label key={question.key}>{question.label}{question.type === 'choice' ? <select required={index === 0} value={report.answers[question.key] || ''} onChange={event => setReport({ ...report, answers: { ...report.answers, [question.key]: event.target.value } })}><option value="">Choose one</option>{question.options.map(option => <option key={option} value={option}>{option}</option>)}</select> : <input required={index === 0} maxLength={500} value={report.answers[question.key] || ''} onChange={event => setReport({ ...report, answers: { ...report.answers, [question.key]: event.target.value } })} />}</label>)}<label>Anything else the health worker should know? <span className="optional">Optional</span><textarea rows={4} maxLength={3000} value={report.details} onChange={event => setReport({ ...report, details: event.target.value })} /></label><button className="button">Send report</button></form>{nextStep && <div className="next-step"><h3>Next step</h3><p>{nextStep}</p></div>}</div>}
    {tab === 'requests' && <div className="content-grid"><section className="panel"><h2>Send a request</h2><form className="form-stack" onSubmit={event => submit(event, '/resident/requests', requestForm, async () => { setRequestForm({ type: 'assistance', details: '' }); setNotice('Your request was sent.') })}><label>Request type<select value={requestForm.type} onChange={event => setRequestForm({ ...requestForm, type: event.target.value })}><option value="assistance">Assistance</option><option value="appointment">Appointment</option><option value="symptom_update">Symptom update</option></select></label><label>Details<textarea required rows={4} maxLength={3000} value={requestForm.details} onChange={event => setRequestForm({ ...requestForm, details: event.target.value })} /></label><button className="button">Send request</button></form></section><section className="panel"><h2>My requests</h2>{dashboard.requests.length ? <ul className="plain-list">{dashboard.requests.map(item => <li key={item.id}><strong>{item.type.replaceAll('_', ' ')}<Badge value={item.status} /></strong><span>{item.details}</span>{item.response && <span><b>Health team:</b> {item.response}</span>}</li>)}</ul> : <p className="empty">No requests yet.</p>}</section></div>}
  </main>
}
