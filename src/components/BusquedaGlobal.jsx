import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MONTHS, t } from '../i18n'

function highlight(text, q) {
  if (!text || !q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

// Búsqueda en todos los meses: concepto, nota, importe exacto o categoría.
export default function BusquedaGlobal({ open, onClose, hogarId, lang, fmt, catMap, catColorMap = {}, catIconMap = {}, onGo }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null = aún sin buscar
  const [searching, setSearching] = useState(false)
  const debounce = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults(null)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !hogarId) return
    const q = query.trim()
    if (debounce.current) clearTimeout(debounce.current)
    if (q.length < 2) { setResults(null); return }
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const esc = q.replace(/[%_,()']/g, ' ').trim()
        const num = parseFloat(q.replace(',', '.'))
        // Categorías cuyo nombre coincide
        const catIds = [...catMap.entries()]
          .filter(([, nombre]) => nombre.toLowerCase().includes(q.toLowerCase()))
          .map(([id]) => id)
        const ors = [`concepto.ilike.%${esc}%`, `nota.ilike.%${esc}%`]
        if (!isNaN(num) && num > 0) ors.push(`importe.eq.${num}`)
        if (catIds.length > 0) ors.push(`categoria_id.in.(${catIds.join(',')})`)
        const { data, error } = await supabase
          .from('movimientos')
          .select('id, tipo, importe, fecha, anio, mes, concepto, nota, categoria_id')
          .eq('hogar_id', hogarId)
          .or(ors.join(','))
          .order('fecha', { ascending: false })
          .limit(50)
        if (!error) setResults(data ?? [])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [query, open, hogarId, catMap])

  if (!open) return null
  const es = lang === 'es'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card global-search-card" role="dialog" aria-modal="true" aria-labelledby="search-modal-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="search-modal-title" className="modal-title">{es ? 'Buscar en todos los meses' : 'Search all months'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label={t(lang, 'close')}>✕</button>
        </div>
        <div className="search-wrap">
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            placeholder={es ? 'Concepto, nota, importe o categoría…' : 'Concept, note, amount or category…'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="search-clear" onClick={() => setQuery('')}>×</button>}
        </div>
        {searching && <p className="empty-text">{t(lang, 'loading')}</p>}
        {!searching && results && results.length === 0 && (
          <p className="empty-text">{t(lang, 'no_results')}</p>
        )}
        {!searching && results && results.length > 0 && (() => {
          const patterns = Object.values(
            results.reduce((acc, m) => {
              const key = (m.concepto || '').toLowerCase()
              if (!key) return acc
              if (!acc[key]) acc[key] = { concepto: m.concepto, count: 0, total: 0, tipo: m.tipo }
              acc[key].count++; acc[key].total += Number(m.importe)
              return acc
            }, {})
          ).filter(p => p.count >= 3).sort((a, b) => b.total - a.total)
          return (
            <>
              {patterns.length > 0 && (
                <div className="gs-patterns">
                  <p className="gs-patterns-title">{es ? 'Recurrentes' : 'Patterns'}</p>
                  {patterns.map(p => (
                    <div key={p.concepto} className="gs-pattern-row">
                      <span className="gs-pattern-concept">{p.concepto}</span>
                      <span className="gs-pattern-meta">{p.count}× · {fmt(p.total)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="global-search-results">
            {results.map(m => {
              const q = query.trim()
              const catId = m.categoria_id
              const catIcon = catIconMap[catId]
              const catColor = catColorMap[catId]
              const conceptText = m.concepto || catMap.get(catId) || (es ? 'Sin concepto' : 'No concept')
              return (
                <button
                  key={m.id}
                  className="global-search-row"
                  onClick={() => { onGo(m); onClose() }}
                  title={es ? 'Ir a este mes' : 'Jump to this month'}
                >
                  <span className="gs-month">{MONTHS[lang][m.mes - 1].slice(0, 3)} {String(m.anio).slice(2)}</span>
                  <span className="gs-concept">
                    {catIcon
                      ? <span className="cat-icon-emoji cat-icon-emoji-sm">{catIcon}</span>
                      : catColor && <span className="movement-cat-dot" style={{ background: catColor }} />
                    }
                    {highlight(conceptText, q)}
                    {m.nota ? <span className="gs-note"> · {highlight(m.nota, q)}</span> : null}
                  </span>
                  <span className={`gs-amount ${m.tipo === 'ingreso' ? 'amount-income' : ''}`}>
                    {m.tipo === 'gasto' ? '−' : '+'}{fmt(Number(m.importe))}
                  </span>
                </button>
              )
            })}
                {results.length === 50 && (
                  <p className="empty-text">{es ? 'Mostrando los 50 más recientes' : 'Showing the 50 most recent'}</p>
                )}
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
