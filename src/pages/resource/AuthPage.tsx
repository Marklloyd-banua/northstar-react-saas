import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, type Location } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { demoCredentials } from '../../auth/mockAuthAdapter'

type AuthLocationState = { from?: Location }

export function AuthPage() {
  const path = useLocation().pathname
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useApp()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [busy, setBusy] = useState(false)

  const isLogin = path === '/login'
  const isInfoPage = path === '/unauthorized' || path === '/session-expired'
  const title = isLogin ? 'Welcome back'
    : path === '/forgot-password' ? 'Reset your password'
    : path === '/reset-password' ? 'Create a new password'
    : path === '/two-factor' ? 'Two-step verification'
    : path === '/unauthorized' ? 'Access denied'
    : 'Session expired'

  const from = (location.state as AuthLocationState | null)?.from
  const destination = from ? `${from.pathname}${from.search}${from.hash}` : '/'

  useEffect(() => {
    if (isLogin && auth.status === 'authenticated') navigate(destination, { replace: true })
  }, [isLogin, auth.status, navigate, destination])

  if (isLogin && auth.status === 'authenticated') return <Navigate to={destination} replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldError('')
    if (path === '/two-factor') { toast('Two-step verification is a frontend demo screen. Connect a backend to verify codes.', 'info'); return }
    if (!isLogin) { toast('If an account matches, next steps will be shown by your connected backend.', 'info'); return }
    if (!email.trim()) { setFieldError('Email address is required.'); return }
    if (!password) { setFieldError('Password is required.'); return }
    setBusy(true)
    try {
      await auth.login({ email, password })
      toast('Demo sign-in complete. Frontend authorization only; backend must enforce security.', 'info')
      navigate(destination, { replace: true })
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unable to sign in.'
      setFieldError(message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page">
    <div className="auth-brand"><span className="brand-mark"><i className="bi bi-hexagon-fill"/></span>northstar <small>PLATFORM</small></div>
    <section className="auth-card">
      <div className="auth-mark"><i className={`bi ${path === '/unauthorized' ? 'bi-shield-lock' : 'bi-stars'}`}/></div>
      <div className="auth-heading">
        <h1>{title}</h1>
        <p>{isLogin ? 'Sign in to your platform workspace.' : path === '/forgot-password' ? 'Enter your email and we’ll guide you through account recovery.' : path === '/unauthorized' ? 'You do not have permission to access that page.' : path === '/session-expired' ? 'Your demo session has ended. Sign in again to continue.' : 'Continue with your administrator account.'}</p>
      </div>
      {isInfoPage ? <div className="d-grid gap-2">
        {auth.status === 'authenticated' && <button type="button" className="btn btn-primary w-100" onClick={() => navigate('/')}>Back to dashboard</button>}
        <button type="button" className={`btn ${auth.status === 'authenticated' ? 'btn-outline-secondary' : 'btn-primary'} w-100`} onClick={() => navigate('/login')}>Return to sign in</button>
      </div> : <form onSubmit={submit} noValidate>
        {path !== '/two-factor' && <label htmlFor="auth-email">Email address<input id="auth-email" className="form-control" type="email" required value={email} onChange={event => { setEmail(event.target.value); if (fieldError) setFieldError('') }} placeholder="you@company.com" autoComplete="username" aria-invalid={fieldError ? true : undefined} aria-describedby={fieldError ? 'auth-error' : undefined}/></label>}
        {(isLogin || path === '/reset-password') && <label htmlFor="auth-password">Password<input id="auth-password" className="form-control" type="password" required minLength={8} value={password} onChange={event => { setPassword(event.target.value); if (fieldError) setFieldError('') }} placeholder="At least 8 characters" autoComplete={isLogin ? 'current-password' : 'new-password'} aria-invalid={fieldError ? true : undefined} aria-describedby={fieldError ? 'auth-error' : undefined}/></label>}
        {path === '/two-factor' && <label htmlFor="auth-code">Authentication code<input id="auth-code" className="form-control" inputMode="numeric" minLength={6} maxLength={6} required placeholder="000000" autoComplete="one-time-code"/></label>}
        {isLogin && <div className="auth-links"><label className="form-check"><input className="form-check-input" type="checkbox"/><span className="form-check-label">Remember me</span></label><Link to="/forgot-password">Forgot password?</Link></div>}
        {fieldError && <div id="auth-error" className="auth-demo-note text-danger" role="alert" style={{ marginTop: 0 }}><i className="bi bi-exclamation-circle"/> {fieldError}</div>}
        <button className="btn btn-primary w-100" type="submit" disabled={busy || auth.loading}>{busy || auth.loading ? 'Signing in…' : isLogin ? 'Sign in' : path === '/forgot-password' ? 'Continue' : path === '/two-factor' ? 'Verify code' : 'Save password'}</button>
      </form>}
      {isLogin && <div className="auth-demo-note" style={{ marginTop: 14 }}><i className="bi bi-info-circle"/> <span><strong>Demo accounts (frontend mock only):</strong><br/>{demoCredentials.map((item) => <span key={item.email}>{item.role}: <code>{item.email}</code> / <code>{item.password}</code><br/></span>)}Frontend authorization is not production security.</span></div>}
      {!isLogin && !isInfoPage && <div className="auth-demo-note"><i className="bi bi-info-circle"/> Frontend demo only. Authentication must be provided by a secure backend.</div>}
      {!isLogin && <Link className="auth-back" to={auth.status === 'authenticated' ? '/' : '/login'}><i className="bi bi-arrow-left me-2"/>{auth.status === 'authenticated' ? 'Back to dashboard' : 'Back to sign in'}</Link>}
    </section>
    <div className="auth-footer">© 2026 Northstar Platform · <span>Contact support</span></div>
  </main>
}
