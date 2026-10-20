import { useEffect, useState } from 'react'
import { api, getToken, setToken } from '../shared/api'
import SuperuserWorkspace from './SuperuserWorkspace'

function AdminApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!getToken()) return
    api('/me').then(authenticatedUser => {
      if (authenticatedUser.role !== 'superuser') {
        setToken(null)
        setError('This account cannot use the admin portal.')
        return
      }
      setUser(authenticatedUser)
    }).catch(() => setToken(null)).finally(() => setLoading(false))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api('/admin/login', { method: 'POST', body: { email, password } })
      setToken(result.token)
      setUser(result.user)
      setPassword('')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    try { await api('/logout', { method: 'POST' }) } catch { /* Clear the local token even if the API is unavailable. */ }
    setToken(null)
    setUser(null)
  }

  return <>
    <header className="site-header"><div className="site-header-inner"><span className="brand">MediTrack Admin</span>{user && <nav aria-label="Admin navigation"><span className="signed-in">{user.name} · Superuser</span><button className="text-button" onClick={logout}>Sign out</button></nav>}</div></header>
    {loading ? <main className="page-container workspace"><p>Loading…</p></main> : user ? <SuperuserWorkspace user={user} /> : <main className="auth-wrap page-container"><div className="auth-panel"><h1>Superuser sign in</h1><p>Registration review portal.</p><form className="form-stack" onSubmit={submit}>
      <label>Email<input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
      {error && <p className="notice error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'}</button>
    </form></div></main>}
    <footer className="site-footer"><div className="page-container">MediTrack · Private admin portal</div></footer>
  </>
}

export default AdminApp
