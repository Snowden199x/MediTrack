import { useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'
import ResidentWorkspace from './ResidentWorkspace'
import StaffWorkspace from './StaffWorkspace'
import PsgcAddressFields from './PsgcAddressFields'
import './App.css'

function Landing({ go }) {
  return <main>
    <section className="landing-intro page-container">
      <div><h1>Health follow-up for the barangay</h1><p>MediTrack gives residents a place to report concerns and helps barangay health teams keep visits, requests, and follow-ups organized.</p><div className="actions"><button className="button" onClick={() => go('/register')}>Create a resident account</button><button className="button secondary" onClick={() => go('/login')}>Sign in</button></div></div>
      <aside className="landing-summary"><h2>How it works</h2><ol><li><strong>Residents share a concern.</strong><span>Answer short questions or send a request to the health team.</span></li><li><strong>Health workers review it.</strong><span>BHWs record visits, schedules, and follow-up actions.</span></li><li><strong>The health center sees trends.</strong><span>Authorized staff review area-level signals before taking action.</span></li></ol></aside>
    </section>
    <section className="landing-section page-container"><h2>Made for everyday health-center work</h2><div className="feature-columns"><article><h3>For residents</h3><p>See reminders, report symptoms in a guided form, and receive a response to requests.</p></article><article><h3>For BHWs</h3><p>Keep resident records, record visits, and follow up on missed checkups or new concerns.</p></article><article><h3>For health-center staff</h3><p>Publish announcements and review aggregated symptom trends for possible follow-up.</p></article></div><p className="safety-copy">Symptom reporting helps describe a concern and decide who to contact next. It does not provide a diagnosis.</p></section>
  </main>
}

function AuthForm({ mode, onAuth, go }) {
  const registering = mode === 'register'
  const [form, setForm] = useState({ first_name: '', middle_initial: '', last_name: '', birth_date: '', age: '', sex: '', email: '', address: '', region_code: '', region_name: '', province_code: '', province_name: '', city_municipality_code: '', city_municipality_name: '', barangay_code: '', barangay_name: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [registrationSent, setRegistrationSent] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)
  const field = (key, value) => setForm(previous => ({ ...previous, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api(registering ? '/register' : '/login', { method: 'POST', body: registering ? { ...form, age: Number(form.age), province_code: form.province_code || null, province_name: form.province_name || null, address: form.address || null } : { email: form.email, password: form.password } })
      if (registering) setRegistrationSent(true)
      else onAuth(result)
    }
    catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }

  if (registrationSent) return <main className="auth-wrap page-container"><div className="auth-panel"><h1>Registration submitted</h1><p className="notice" role="status">Your registration is waiting for superuser review. You can sign in after it is approved.</p><button className="button secondary" onClick={() => go('/login')}>Back to sign in</button></div></main>

  return <main className="auth-wrap page-container"><div className="auth-panel"><h1>{registering ? 'Resident sign up' : 'Sign in'}</h1><p>{registering ? 'Complete your details and select your Philippine address. Resident accounts are reviewed before access.' : 'Use your MediTrack account to continue.'}</p><form className="form-stack" onSubmit={submit}>
    {registering && <><div className="form-row"><label>First name<input required maxLength="100" autoComplete="given-name" value={form.first_name} onChange={event => field('first_name', event.target.value)} /></label><label>Last name<input required maxLength="100" autoComplete="family-name" value={form.last_name} onChange={event => field('last_name', event.target.value)} /></label></div><div className="form-row"><label>Middle initial <span className="optional">Optional</span><input maxLength="10" value={form.middle_initial} onChange={event => field('middle_initial', event.target.value)} /></label><label>Birthday<input required type="date" autoComplete="bday" value={form.birth_date} onChange={event => field('birth_date', event.target.value)} /></label></div><label>Age<input required type="number" min="0" max="120" value={form.age} onChange={event => field('age', event.target.value)} /></label><label>Sex<select required value={form.sex} onChange={event => field('sex', event.target.value)}><option value="">Select sex</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="undisclosed">Prefer not to say</option></select></label><PsgcAddressFields value={form} onChange={location => setForm(previous => ({ ...previous, ...location }))} /><label>House number / street <span className="optional">Optional</span><input maxLength="255" autoComplete="street-address" value={form.address} onChange={event => field('address', event.target.value)} /></label></>}
    <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={event => field('email', event.target.value)} /></label><label>Password<div className="password-control"><input required type={passwordVisible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} minLength="8" value={form.password} onChange={event => field('password', event.target.value)} /><button className="password-toggle" type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(visible => !visible)}>{passwordVisible ? 'Hide' : 'Show'}</button></div>{registering && <span className="field-hint">Use at least 8 characters, including uppercase and lowercase letters, a number, and a symbol.</span>}</label>
    {registering && <label>Confirm password<div className="password-control"><input required type={confirmationVisible ? 'text' : 'password'} autoComplete="new-password" minLength="8" value={form.password_confirmation} onChange={event => field('password_confirmation', event.target.value)} /><button className="password-toggle" type="button" aria-label={confirmationVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmationVisible} onClick={() => setConfirmationVisible(visible => !visible)}>{confirmationVisible ? 'Hide' : 'Show'}</button></div></label>}
    {error && <p className="notice error" role="alert">{error}</p>}<button className="button" disabled={busy}>{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
  </form><p className="auth-switch">{registering ? 'Already have an account?' : 'Need a resident account?'} <button className="link-button" onClick={() => go(registering ? '/login' : '/register')}>{registering ? 'Sign in' : 'Sign up'}</button></p></div></main>
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    if (getToken()) api('/me').then(authenticatedUser => {
      if (authenticatedUser.role === 'superuser') {
        setToken(null)
        return
      }
      setUser(authenticatedUser)
      if (window.location.pathname === '/app') {
        window.history.replaceState({}, '', '/app')
        setPath('/app')
      }
    }).catch(() => setToken(null)).finally(() => setLoading(false))
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function go(nextPath) { window.history.pushState({}, '', nextPath); setPath(nextPath); window.scrollTo(0, 0) }
  function onAuth(result) { setToken(result.token); setUser(result.user); go('/app') }
  async function logout() { try { await api('/logout', { method: 'POST' }) } catch { /* Discard the local token anyway. */ } setToken(null); setUser(null); go('/') }
  async function refreshUser() { setUser(await api('/me')) }

  const roleName = user?.role === 'health_center' ? 'Health center' : user?.role === 'bhw' ? 'BHW' : 'Resident'
  const homePath = '/app'

  return <><header className="site-header"><div className="site-header-inner"><button className="brand" onClick={() => go(user ? homePath : '/')}>MediTrack</button><nav aria-label="Main navigation">{user ? <><span className="signed-in">{user.name} · {roleName}</span><button className="text-button" onClick={logout}>Sign out</button></> : <><button className="text-button" onClick={() => go('/login')}>Sign in</button><button className="button small" onClick={() => go('/register')}>Resident sign up</button></>}</nav></div></header>
    {loading ? <main className="page-container workspace"><p>Loading…</p></main> : user && path === '/app' && user.role !== 'superuser' ? user.role === 'resident' ? <ResidentWorkspace user={user} onRefreshUser={refreshUser} /> : <StaffWorkspace user={user} /> : !user && (path === '/login' || path === '/register') ? <AuthForm key={path} mode={path.slice(1)} onAuth={onAuth} go={go} /> : <Landing go={go} />}
    <footer className="site-footer"><div className="page-container">MediTrack · Barangay health follow-up</div></footer>
  </>
}

export default App
