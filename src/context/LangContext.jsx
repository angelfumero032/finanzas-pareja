import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const LangContext = createContext({ lang: 'en', setLang: () => {} })

export function LangProvider({ profile, children }) {
  const [lang, setLangState] = useState(profile?.idioma ?? 'en')

  useEffect(() => {
    if (profile?.idioma) setLangState(profile.idioma)
  }, [profile?.idioma])

  async function setLang(newLang) {
    setLangState(newLang)
    if (profile?.id) {
      await supabase.from('usuarios').update({ idioma: newLang }).eq('id', profile.id)
    }
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
