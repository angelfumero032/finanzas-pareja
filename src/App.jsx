import { AuthProvider, useAuth } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import LoginPage from './pages/LoginPage'
import MesView from './pages/MesView'
import './App.css'

function AppInner() {
  const { session, profile } = useAuth()

  if (session === undefined) {
    return <div className="splash">Cargando…</div>
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <LangProvider profile={profile}>
      <MesView />
    </LangProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
