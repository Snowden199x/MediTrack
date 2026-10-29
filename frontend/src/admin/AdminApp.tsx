import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api, getToken, setToken } from '../shared/api'
import SuperuserWorkspace from './SuperuserWorkspace'
import './css/login.css'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Enter your password.'),
})

function AdminApp() {
  const [user, setUser] = useState(null)
  const queryClient = useQueryClient()
  const hasToken = Boolean(getToken())
  const { data: authenticatedUser, isLoading: checkingSession, isError: sessionError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api('/me'),
    enabled: hasToken,
    retry: false,
  })
  const loading = hasToken && checkingSession
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (!hasToken) { setUser(null); return }
    if (sessionError) { setToken(null); setUser(null); return }
    if (authenticatedUser) {
      if (authenticatedUser.role !== 'superuser') { setToken(null); setUser(null); return }
      setUser(authenticatedUser)
    }
  }, [authenticatedUser, hasToken, sessionError])

  async function submit(credentials) {
    try {
      const result = await api('/admin/login', { method: 'POST', body: credentials })
      queryClient.removeQueries({ queryKey: ['auth', 'me'] })
      setToken(result.token)
      setUser(result.user)
    } catch (failure) {
      setError('root.server', { message: failure.message })
    }
  }

  async function logout() {
    try { await api('/logout', { method: 'POST' }) } catch { /* ignore */ }
    queryClient.removeQueries({ queryKey: ['auth', 'me'] })
    setToken(null)
    setUser(null)
  }

  if (loading) {
    return <div className="admin-loading"><p className="loading" role="status">Loading…</p></div>
  }

  if (user) {
    return <SuperuserWorkspace user={user} onLogout={logout} />
  }

  return (
    <main className="admin-auth">
      <aside className="admin-auth-aside" aria-label="About the MediTrack admin portal">
        <div className="admin-auth-brand">
          <span className="admin-auth-mark" aria-hidden="true" />MediTrack <small>Admin</small>
        </div>
        <div className="admin-auth-copy">
          <span className="admin-auth-eyebrow">Private admin portal</span>
          <h1>Keep the barangay health team moving.</h1>
          <p>Review resident registrations, triage reports, and keep follow-ups on schedule.</p>
        </div>
        <ul className="admin-auth-points">
          <li>Registration review queue</li>
          <li>Reports and follow-ups</li>
          <li>Resident accounts and access</li>
        </ul>
        <p className="admin-auth-foot">Authorised personnel only</p>
      </aside>
      <section className="admin-auth-panel">
        <div className="admin-auth-card">
          <span className="admin-auth-eyebrow">Superuser access</span>
          <h2>Log in to continue</h2>
          <p className="admin-auth-lede">Use your MediTrack superuser credentials to open the admin portal.</p>
          <form className="form-stack admin-auth-form" onSubmit={handleSubmit(submit)}>
            <label>Email<input type="email" autoComplete="username" {...register('email')} /></label>
            {errors.email && <p className="notice error" role="alert">{errors.email.message}</p>}
            <label>Password<input type="password" autoComplete="current-password" {...register('password')} /></label>
            {errors.password && <p className="notice error" role="alert">{errors.password.message}</p>}
            {errors.root?.server && <p className="notice error" role="alert">{errors.root.server.message}</p>}
            <button className="button admin-auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : 'Log in'}</button>
          </form>
          <p className="admin-auth-note">Access is limited to approved superusers.</p>
        </div>
      </section>
    </main>
  )
}

export default AdminApp
