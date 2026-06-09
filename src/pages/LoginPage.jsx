import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { t } from '../i18n'

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
        setError(t('es', 'invalid_credentials'))
      } else {
        localStorage.setItem('lastEmail', email)
      }
    } catch {
      setError(t('es', 'invalid_credentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon">💰</div>
        <h1 className="login-title">Finanzas en pareja</h1>
        <p className="login-sub">Accede con tu cuenta</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label htmlFor="lp-email">Correo</label>
            <input
              id="lp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>
          <div className="field">
            <label htmlFor="lp-pass">Contraseña</label>
            <div className="pass-wrap">
              <input
                id="lp-pass"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
              >
                {showPass ? 'ocultar' : 'ver'}
              </button>
            </div>
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
