import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)  // undefined = cargando
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session ?? null)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(uid) {
    const { data } = await supabase.from('usuarios').select('*').eq('id', uid).single()
    setProfile(data ?? null)
  }

  return (
    <AuthContext.Provider value={{ session, profile, setProfile, refreshProfile: () => session && fetchProfile(session.user.id) }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
