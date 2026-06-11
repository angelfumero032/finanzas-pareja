import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { t } from '../i18n'

const loginLang = navigator.language?.startsWith('es') ? 'es' : 'en'

export default function LoginPage() {
  const [email, setEmail] = useState(() => localStorage.getItem('lastEmail') ?? '')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(t(loginLang, 'invalid_credentials'))
      } else {
        localStorage.setItem('lastEmail', email)
      }
    } catch {
      setError(t(loginLang, 'invalid_credentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon">💰</div>
        <h1 className="login-title">{t(loginLang, 'app_name')}</h1>
        <p className="login-sub">{t(loginLang, 'sign_in')}</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label htmlFor="lp-email">{t(loginLang, 'email')}</label>
            <input
              id="lp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              autoFocus={!email}
            />
          </div>
          <div className="field">
            <label htmlFor="lp-pass">{t(loginLang, 'password')}</label>
            <div className="pass-wrap">
              <input
                id="lp-pass"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoFocus={!!email}
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
              >
                {showPass
                  ? (loginLang === 'es' ? 'ocultar' : 'hide')
                  : (loginLang === 'es' ? 'ver' : 'show')}
              </button>
            </div>
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? t(loginLang, 'signing_in') : t(loginLang, 'sign_in_btn')}
          </button>
        </form>
      </div>
    </div>
  )
}
