import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../../shared/api'
import PsgcAddressFields from '../../shared/PsgcAddressFields'
import LocationPickerModal from '../../shared/LocationPickerModal'

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
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
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

function AuthAside({ registering }) {
  return <aside className="auth-aside" aria-label="About MediTrack">
    <div className="auth-aside-copy">
      <span className="auth-eyebrow">Resident portal</span>
      <h2>{registering ? 'Health follow-up, made easier.' : 'Welcome back to MediTrack.'}</h2>
      <p>A simple place to share concerns and stay connected with your barangay health team.</p>
    </div>
    <div className="auth-visual" aria-hidden="true">
      <div className="auth-visual-orbit auth-visual-orbit-one" />
      <div className="auth-visual-orbit auth-visual-orbit-two" />
      <div className="auth-visual-card">
        <span className="auth-visual-icon"><span /></span>
        <div><strong>Health follow-up</strong><small>Connected to your community</small></div>
        <svg viewBox="0 0 220 54" fill="none"><path d="M3 29h54l13-1 12-20 15 42 15-32 12 11h93" /></svg>
      </div>
      <div className="auth-visual-caption"><span className="auth-status-dot" /> Barangay health, together</div>
    </div>
    <span className="auth-aside-footer">MediTrack · Barangay health follow-up</span>
  </aside>
}

function AuthPage({ mode, onAuth, go }) {
  const registering = mode === 'register'
  const [registrationSent, setRegistrationSent] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const { register, handleSubmit, setError, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver((registering ? residentRegistrationSchema : loginSchema) as any),
    defaultValues: { first_name: '', middle_initial: '', last_name: '', birth_date: '', age: '', sex: '', email: '', address: '', region_code: '', region_name: '', province_code: '', province_name: '', city_municipality_code: '', city_municipality_name: '', barangay_code: '', barangay_name: '', latitude: null, longitude: null, password: '', password_confirmation: '' },
  })
  const form = watch()
  const validationMessage = (errors.root?.server?.message || Object.values(errors).map(error => error?.message).find(Boolean)) as string | undefined

  function handleLocationConfirm(coords: { lat: number; lng: number }) {
    setValue('latitude', coords.lat)
    setValue('longitude', coords.lng)
    setShowMapPicker(false)
  }

  function clearLocation() {
    setValue('latitude', null)
    setValue('longitude', null)
  }

  async function submit(values) {
    try {
      const body = registering
        ? { ...values, age: Number(values.age), province_code: values.province_code || null, province_name: values.province_name || null, address: values.address || null, latitude: values.latitude ?? null, longitude: values.longitude ?? null }
        : { email: values.email, password: values.password }
      const result = await api(registering ? '/register' : '/login', { method: 'POST', body })
      if (registering) setRegistrationSent(true)
      else onAuth(result)
    }
    catch (failure) { setError('root.server', { message: failure.message }) }
  }

  if (registrationSent) return <main className="auth-wrap auth-page page-container"><div className="auth-layout auth-success-layout"><AuthAside registering={false} /><section className="auth-panel auth-success"><span className="auth-eyebrow">Registration received</span><h1>Registration submitted</h1><p className="notice" role="status">Your registration is waiting for superuser review. You can log in after it is approved.</p><button className="button" onClick={() => go('/login')}>Back to log in</button></section></div></main>

  return <main className={`auth-wrap auth-page auth-${registering ? 'register' : 'login'} page-container`}>
    <div className="auth-layout">
      <AuthAside registering={registering} />
      <section className="auth-panel">
        <div className="auth-heading">
          <span className="auth-eyebrow">{registering ? 'Create your account' : 'Resident access'}</span>
          <h1>{registering ? 'Register as a resident' : 'Welcome back'}</h1>
          <p>{registering ? 'Complete your details and select your Philippine address. Resident accounts are reviewed before access.' : 'Use your MediTrack account to continue.'}</p>
        </div>
        <form className="form-stack auth-form" onSubmit={handleSubmit(submit)}>
          {registering && <>
            <div className="auth-section-heading"><span>01</span><div><strong>Your details</strong><small>Personal information and barangay address</small></div></div>
            <div className="form-row three"><label>First name<input required maxLength={100} autoComplete="given-name" {...register('first_name')} /></label><label>Last name<input required maxLength={100} autoComplete="family-name" {...register('last_name')} /></label><label><span>Middle initial <span className="optional">Optional</span></span><input maxLength={10} {...register('middle_initial')} /></label></div>
            <div className="form-row three"><label>Birthday<input required type="date" autoComplete="bday" {...register('birth_date')} /></label><label>Age<input required type="number" min="0" max="120" {...register('age')} /></label><label>Sex<select required {...register('sex')}><option value="">Select sex</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="undisclosed">Prefer not to say</option></select></label></div>
            <div className="auth-full-row"><PsgcAddressFields value={form} onChange={location => Object.entries(location).forEach(([key, value]) => setValue(key as any, value))} /></div>
            <label className="auth-full-row">House number / street <span className="optional">Optional</span><input maxLength={255} autoComplete="street-address" {...register('address')} /></label>
            <div className="location-picker">
              <div className="location-picker-label">
                <span>Home location <span className="optional">Optional</span></span>
                <span className="location-picker-hint">Open the map and click your exact home location. This helps the health center find your household.</span>
              </div>
              {form.latitude && form.longitude ? (
                <div className="location-captured">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6Z"/><circle cx="12" cy="8" r="2"/></svg>
                  <span>Location pinned ({(form.latitude as number).toFixed(5)}, {(form.longitude as number).toFixed(5)})</span>
                  <button type="button" className="link-button" onClick={() => setShowMapPicker(true)}>Edit</button>
                  <button type="button" className="link-button" onClick={clearLocation}>Remove</button>
                </div>
              ) : (
                <button type="button" className="button secondary small" onClick={() => setShowMapPicker(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6Z"/><circle cx="12" cy="8" r="2"/></svg>
                  Set location on map
                </button>
              )}
            </div>
            {showMapPicker && <LocationPickerModal initial={form.latitude && form.longitude ? { lat: form.latitude as number, lng: form.longitude as number } : null} onConfirm={handleLocationConfirm} onClose={() => setShowMapPicker(false)} />}
            <div className="auth-section-heading auth-section-account"><span>02</span><div><strong>Sign-in details</strong><small>Use these details to access MediTrack</small></div></div>
          </>}
          <label className={registering ? 'auth-full-row' : ''}>Email<input required type="email" autoComplete="email" {...register('email')} /></label>
          <label>Password<div className="password-control"><input required type={passwordVisible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} minLength={8} {...register('password')} /><button className="password-toggle" type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(visible => !visible)}>{passwordVisible ? 'Hide' : 'Show'}</button></div>{registering && <span className="field-hint">Use at least 8 characters, including uppercase and lowercase letters, a number, and a symbol.</span>}</label>
          {registering && <label>Confirm password<div className="password-control"><input required type={confirmationVisible ? 'text' : 'password'} autoComplete="new-password" minLength={8} {...register('password_confirmation')} /><button className="password-toggle" type="button" aria-label={confirmationVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmationVisible} onClick={() => setConfirmationVisible(visible => !visible)}>{confirmationVisible ? 'Hide' : 'Show'}</button></div></label>}
          {validationMessage && <p className="notice error" role="alert">{validationMessage}</p>}
          <button className="button auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : registering ? 'Create account' : 'Log in'}</button>
        </form>
        <p className="auth-switch">{registering ? 'Already have an account?' : 'Need a resident account?'} <button className="link-button" onClick={() => go(registering ? '/login' : '/register')}>{registering ? 'Log in' : 'Register'}</button></p>
      </section>
    </div>
  </main>
}

export default AuthPage