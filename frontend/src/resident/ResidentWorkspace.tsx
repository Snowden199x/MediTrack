import { useEffect, useState } from 'react'
import { api } from '../shared/api'
import PsgcAddressFields from '../shared/PsgcAddressFields'
import ResidentSidebar, { type ResidentSection } from './ResidentSidebar'
import HomePage from './pages/HomePage'
import ReportSymptomsPage from './pages/ReportSymptomsPage'
import MyCheckupsPage from './pages/MyCheckupsPage'
import NewsPage from './pages/NewsPage'
import RegisterAccountPage from './pages/RegisterAccountPage'
import './css/layout.css'

interface User {
  name: string
  [key: string]: unknown
}

interface Props {
  user: User
  onRefreshUser: () => Promise<void>
  onLogout: () => void
}

interface ProfileState {
  address: string
  region_code: string
  region_name: string
  province_code: string
  province_name: string
  city_municipality_code: string
  city_municipality_name: string
  barangay_code: string
  barangay_name: string
}

interface ReportState {
  category: string
  onset_date: string
  severity: string
  details: string
  answers: Record<string, string>
}

export default function ResidentWorkspace({ user, onRefreshUser, onLogout }: Props) {
  const [section, setSection] = useState<ResidentSection>('home')
  const [dashboard, setDashboard] = useState<any>(null)
  const [questionnaire, setQuestionnaire] = useState<any>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<ProfileState>({
    address: '', region_code: '', region_name: '',
    province_code: '', province_name: '',
    city_municipality_code: '', city_municipality_name: '',
    barangay_code: '', barangay_name: '',
  })
  const [report, setReport] = useState<ReportState>({
    category: '', onset_date: '', severity: 'unsure', details: '', answers: {},
  })
  const [nextStep, setNextStep] = useState('')

  async function refresh() {
    try {
      const [data, questions] = await Promise.all([
        api('/resident/dashboard'),
        api('/resident/symptom-questions'),
      ])
      setDashboard(data)
      setQuestionnaire(questions)
      setError('')
    } catch (failure: any) {
      setError(failure.message)
    }
  }

  useEffect(() => { refresh() }, [])

  async function submitForm(event: React.FormEvent, path: string, body: unknown, onSuccess: (result: any) => Promise<void>) {
    event.preventDefault()
    setError('')
    try {
      const result = await api(path, { method: 'POST', body })
      await onSuccess(result)
      await refresh()
    } catch (failure: any) {
      setError(failure.message)
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (!dashboard) {
    return (
      <div className="resident-loading">
        <p className="loading" role="status">Loading your information…</p>
        {error && <p className="notice error" role="alert">{error}</p>}
      </div>
    )
  }

  // ── Profile completion gate ────────────────────────────────────────────────
  if (dashboard.needs_profile) {
    return (
      <main className="page-container workspace narrow">
        <h1>Complete your resident profile</h1>
        <p>Choose your address before sending reports.</p>
        <form
          className="form-stack"
          onSubmit={event => submitForm(
            event,
            '/resident/profile',
            {
              ...profile,
              province_code: profile.province_code || null,
              province_name: profile.province_name || null,
              address: profile.address || null,
            },
            async () => { await onRefreshUser(); setNotice('Profile completed.') },
          )}
        >
          <PsgcAddressFields
            value={profile}
            onChange={location => setProfile(previous => ({ ...previous, ...location }))}
          />
          <label>
            House number / street <span className="optional">Optional</span>
            <input
              maxLength={255}
              value={profile.address}
              onChange={event => setProfile({ ...profile, address: event.target.value })}
            />
          </label>
          {error && <p className="notice error">{error}</p>}
          <button className="button">Save profile</button>
        </form>
      </main>
    )
  }

  const categories = (questionnaire?.categories ?? {}) as Record<string, { label: string; questions: Array<{ key: string; label: string; type: string; options: string[] }> }>

  // ── Main shell ─────────────────────────────────────────────────────────────
  return (
    <div className="resident-shell">
      <ResidentSidebar
        user={user}
        section={section}
        onSection={s => { setSection(s); setNotice(''); setError('') }}
        onLogout={onLogout}
      />

      <main className="resident-main">
        {notice && (
          <div style={{ padding: '20px 40px 0' }}>
            <p className="notice" role="status">{notice}</p>
          </div>
        )}
        {error && (
          <div style={{ padding: '20px 40px 0' }}>
            <p className="notice error" role="alert">{error}</p>
          </div>
        )}

        {section === 'home' && (
          <HomePage
            user={user}
            dashboard={dashboard}
            categories={categories}
            onSection={s => { setSection(s); setNotice(''); setError('') }}
          />
        )}

        {section === 'report' && (
          <ReportSymptomsPage
            categories={categories}
            report={report}
            nextStep={nextStep}
            onReportChange={setReport}
            onSubmit={event => submitForm(
              event,
              '/resident/symptom-reports',
              { ...report, onset_date: report.onset_date || null },
              async result => {
                setNextStep(result.next_step ?? '')
                setReport({ category: '', onset_date: '', severity: 'unsure', details: '', answers: {} })
                setNotice('Your report was sent.')
              },
            )}
          />
        )}

        {section === 'checkups' && (
          <MyCheckupsPage appointments={dashboard.appointments ?? []} />
        )}

        {section === 'news' && (
          <NewsPage announcements={dashboard.announcements ?? []} />
        )}

        {section === 'register' && (
          <RegisterAccountPage onHome={() => setSection('home')} />
        )}
      </main>
    </div>
  )
}
