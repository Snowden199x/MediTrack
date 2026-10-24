import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api, getToken, setToken } from '../shared/api'
import SuperuserWorkspace from './SuperuserWorkspace'

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
      if (authenticatedUser.role !== 'superuser') {
        setToken(null)
        setUser(null)
        return
      }

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
    try { await api('/logout', { method: 'POST' }) } catch { /* Clear the local token even if the API is unavailable. */ }
    queryClient.removeQueries({ queryKey: ['auth', 'me'] })
    setToken(null)
    setUser(null)
  }

  return <>
    <header className="site-header"><div className="site-header-inner"><span className="brand"><span className="brand-mark" aria-hidden="true" />MediTrack Admin</span>{user && <nav aria-label="Admin navigation"><span className="signed-in">{user.name} · Superuser</span><button className="text-button" onClick={logout}>Log out</button></nav>}</div></header>
    {loading ? <main className="page-container workspace"><p className="loading" role="status">Loading…</p></main> : user ? <SuperuserWorkspace user={user} /> : <main className="auth-wrap page-container"><div className="auth-panel"><h1>Superuser log in</h1><p>Registration review portal.</p><form className="form-stack" onSubmit={handleSubmit(submit)}>
      <label>Email<input type="email" autoComplete="username" {...register('email')} /></label>
      {errors.email && <p className="notice error" role="alert">{errors.email.message}</p>}
      <label>Password<input type="password" autoComplete="current-password" {...register('password')} /></label>
      {errors.password && <p className="notice error" role="alert">{errors.password.message}</p>}
      {errors.root?.server && <p className="notice error" role="alert">{errors.root.server.message}</p>}
      <button className="button" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : 'Log in'}</button>
    </form></div></main>}
    <footer className="site-footer"><div className="page-container">MediTrack · Private admin portal</div></footer>
  </>
}

export default AdminApp
