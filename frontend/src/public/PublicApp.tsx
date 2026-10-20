import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api, getToken, setToken } from '../shared/api'
import ResidentWorkspace from '../resident/ResidentWorkspace'
import StaffWorkspace from '../staff/StaffWorkspace'
import PsgcAddressFields from '../shared/PsgcAddressFields'
import './public.css'

const residentRegistrationSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name.').max(100),
  middle_initial: z.string().max(10),
  last_name: z.string().trim().min(1, 'Enter your last name.').max(100),
  birth_date: z.string().min(1, 'Enter your birthday.'),
  age: z.coerce.number().int().min(0).max(120),
  sex: z.enum(['female', 'male', 'other', 'undisclosed']),
  email: z.email(),
  address: z.string().max(255),
  region_code: z.string(),
  region_name: z.string(),
  province_code: z.string(),
  province_name: z.string(),
  city_municipality_code: z.string(),
  city_municipality_name: z.string(),
  barangay_code: z.string(),
  barangay_name: z.string(),
  password: z.string().min(8).regex(/[a-z]/, 'Include a lowercase letter.').regex(/[A-Z]/, 'Include an uppercase letter.').regex(/\d/, 'Include a number.').regex(/[^A-Za-z0-9]/, 'Include a symbol.'),
  password_confirmation: z.string().min(8),
}).refine((values) => values.password === values.password_confirmation, {
  message: 'Passwords do not match.',
  path: ['password_confirmation'],
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Enter your password.'),
})

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
  const [registrationSent, setRegistrationSent] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)
  const { register, handleSubmit, setError, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver((registering ? residentRegistrationSchema : loginSchema) as any),
    defaultValues: { first_name: '', middle_initial: '', last_name: '', birth_date: '', age: '', sex: '', email: '', address: '', region_code: '', region_name: '', province_code: '', province_name: '', city_municipality_code: '', city_municipality_name: '', barangay_code: '', barangay_name: '', password: '', password_confirmation: '' },
  })
  const form = watch()
  const validationMessage = (errors.root?.server?.message || Object.values(errors).map(error => error?.message).find(Boolean)) as string | undefined

  async function submit(values) {
    try {
      const body = registering
        ? { ...values, age: Number(values.age), province_code: values.province_code || null, province_name: values.province_name || null, address: values.address || null }
        : { email: values.email, password: values.password }
      const result = await api(registering ? '/register' : '/login', { method: 'POST', body })
      if (registering) setRegistrationSent(true)
      else onAuth(result)
    }
    catch (failure) { setError('root.server', { message: failure.message }) }
  }

  if (registrationSent) return <main className="auth-wrap page-container"><div className="auth-panel"><h1>Registration submitted</h1><p className="notice" role="status">Your registration is waiting for superuser review. You can sign in after it is approved.</p><button className="button secondary" onClick={() => go('/login')}>Back to sign in</button></div></main>

  return <main className="auth-wrap page-container"><div className="auth-panel"><h1>{registering ? 'Resident sign up' : 'Sign in'}</h1><p>{registering ? 'Complete your details and select your Philippine address. Resident accounts are reviewed before access.' : 'Use your MediTrack account to continue.'}</p><form className="form-stack" onSubmit={handleSubmit(submit)}>
    {registering && <><div className="form-row"><label>First name<input required maxLength={100} autoComplete="given-name" {...register('first_name')} /></label><label>Last name<input required maxLength={100} autoComplete="family-name" {...register('last_name')} /></label></div><div className="form-row"><label>Middle initial <span className="optional">Optional</span><input maxLength={10} {...register('middle_initial')} /></label><label>Birthday<input required type="date" autoComplete="bday" {...register('birth_date')} /></label></div><label>Age<input required type="number" min="0" max="120" {...register('age')} /></label><label>Sex<select required {...register('sex')}><option value="">Select sex</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="undisclosed">Prefer not to say</option></select></label><PsgcAddressFields value={form} onChange={location => Object.entries(location).forEach(([key, value]) => setValue(key as any, value))} /><label>House number / street <span className="optional">Optional</span><input maxLength={255} autoComplete="street-address" {...register('address')} /></label></>}
    <label>Email<input required type="email" autoComplete="email" {...register('email')} /></label><label>Password<div className="password-control"><input required type={passwordVisible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} minLength={8} {...register('password')} /><button className="password-toggle" type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(visible => !visible)}>{passwordVisible ? 'Hide' : 'Show'}</button></div>{registering && <span className="field-hint">Use at least 8 characters, including uppercase and lowercase letters, a number, and a symbol.</span>}</label>
    {registering && <label>Confirm password<div className="password-control"><input required type={confirmationVisible ? 'text' : 'password'} autoComplete="new-password" minLength={8} {...register('password_confirmation')} /><button className="password-toggle" type="button" aria-label={confirmationVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmationVisible} onClick={() => setConfirmationVisible(visible => !visible)}>{confirmationVisible ? 'Hide' : 'Show'}</button></div></label>}
    {validationMessage && <p className="notice error" role="alert">{validationMessage}</p>}<button className="button" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
  </form><p className="auth-switch">{registering ? 'Already have an account?' : 'Need a resident account?'} <button className="link-button" onClick={() => go(registering ? '/login' : '/register')}>{registering ? 'Sign in' : 'Sign up'}</button></p></div></main>
}

function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hasToken = Boolean(getToken())
  const { data: authenticatedUser, isLoading: checkingSession, isError: sessionError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api('/me'),
    enabled: hasToken,
    retry: false,
  })
  const loading = hasToken && checkingSession

  useEffect(() => {
    if (!hasToken) {
      setUser(null)
      return
    }

    if (sessionError) {
      setToken(null)
      setUser(null)
      return
    }

    if (authenticatedUser) {
      if (authenticatedUser.role === 'superuser') {
        setToken(null)
        setUser(null)
        return
      }

      setUser(authenticatedUser)
    }
  }, [authenticatedUser, hasToken, sessionError])

  function go(nextPath) { navigate(nextPath); window.scrollTo(0, 0) }
  function onAuth(result) { queryClient.removeQueries({ queryKey: ['auth', 'me'] }); setToken(result.token); setUser(result.user); go('/app') }
  async function logout() { try { await api('/logout', { method: 'POST' }) } catch { /* Discard the local token anyway. */ } queryClient.removeQueries({ queryKey: ['auth', 'me'] }); setToken(null); setUser(null); go('/') }
  async function refreshUser() { setUser(await api('/me')) }

  const roleName = user?.role === 'health_center' ? 'Health center' : user?.role === 'bhw' ? 'BHW' : 'Resident'
  const homePath = '/app'

  return <><header className="site-header"><div className="site-header-inner"><button className="brand" onClick={() => go(user ? homePath : '/')}>MediTrack</button><nav aria-label="Main navigation">{user ? <><span className="signed-in">{user.name} · {roleName}</span><button className="text-button" onClick={logout}>Sign out</button></> : <><button className="text-button" onClick={() => go('/login')}>Sign in</button><button className="button small" onClick={() => go('/register')}>Resident sign up</button></>}</nav></div></header>
    {loading ? <main className="page-container workspace"><p>Loading…</p></main> : <Routes>
      <Route path="/" element={<Landing go={go} />} />
      <Route path="/login" element={user ? <Landing go={go} /> : <AuthForm mode="login" onAuth={onAuth} go={go} />} />
      <Route path="/register" element={user ? <Landing go={go} /> : <AuthForm mode="register" onAuth={onAuth} go={go} />} />
      <Route path="/app" element={user && user.role !== 'superuser' ? user.role === 'resident' ? <ResidentWorkspace user={user} onRefreshUser={refreshUser} /> : <StaffWorkspace user={user} /> : <Landing go={go} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>}
    <footer className="site-footer"><div className="page-container">MediTrack · Barangay health follow-up</div></footer>
  </>
}

export default App
