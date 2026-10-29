import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../shared/api'
import ResidentWorkspace from '../resident/ResidentWorkspace'
import StaffWorkspace from '../staff/StaffWorkspace'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import './css/portal.css'

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
  // Resident workspace is a full-page shell (like admin); suppress the public header/footer for it.
  const isResidentShell = Boolean(user && user.role === 'resident')

  if (loading) {
    return <main className="page-container workspace"><p className="loading" role="status">Loading…</p></main>
  }

  if (isResidentShell) {
    return (
      <Routes>
        <Route path="/app" element={<ResidentWorkspace user={user} onRefreshUser={refreshUser} onLogout={logout} />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    )
  }

  return <><header className="site-header"><div className="site-header-inner"><button className="brand" onClick={() => go(user ? homePath : '/')}><span className="brand-mark" aria-hidden="true" />MediTrack</button><nav aria-label="Main navigation">{user ? <><span className="signed-in">{user.name} · {roleName}</span><button className="text-button" onClick={logout}>Log out</button></> : <><button className="text-button" onClick={() => go('/login')}>Log in</button><button className="button small" onClick={() => go('/register')}>Register</button></>}</nav></div></header>
    <Routes>
      <Route path="/" element={<LandingPage go={go} />} />
      <Route path="/login" element={user ? <LandingPage go={go} /> : <AuthPage mode="login" onAuth={onAuth} go={go} />} />
      <Route path="/register" element={user ? <LandingPage go={go} /> : <AuthPage mode="register" onAuth={onAuth} go={go} />} />
      <Route path="/app" element={user && user.role !== 'superuser' ? <StaffWorkspace user={user} /> : <LandingPage go={go} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <footer className="site-footer"><div className="page-container">MediTrack · Barangay health follow-up</div></footer>
  </>
}

export default App