import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import './App.css'

// Etapa 1 (esqueleto): página mínima que confirma que el andamiaje arranca y,
// si hay claves de Supabase, comprueba la conexión. El login, la vista de mes y
// las notificaciones llegan en la Etapa 3.
export default function App() {
  const [estado, setEstado] = useState('comprobando…')

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    if (!url) {
      setEstado('sin configurar — copia .env.example a .env.local (ver README)')
      return
    }
    supabase.auth
      .getSession()
      .then(({ error }) =>
        setEstado(error ? `error: ${error.message}` : `conectado a ${new URL(url).host}`),
      )
      .catch((e) => setEstado(`error: ${e.message}`))
  }, [])

  return (
    <main className="wrap">
      <h1>Finanzas en pareja</h1>
      <p className="lead">
        Gastos, ingresos y presupuestos por mes — compartido y en tiempo real.
      </p>

      <section className="card">
        <strong>Estado de la v1 · Etapa 1 (esqueleto)</strong>
        <ul>
          <li>Andamiaje Vite + React (PWA) ✓</li>
          <li>
            Supabase: <code>{estado}</code>
          </li>
          <li>
            Login, vista de mes y notificaciones: <em>Etapa 3</em>
          </li>
        </ul>
      </section>

      <p className="hint">
        Siguiente paso: crear el proyecto Supabase y aplicar{' '}
        <code>supabase/schema.sql</code> (ver README).
      </p>
    </main>
  )
}
