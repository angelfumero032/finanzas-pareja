import { useEffect, useMemo } from 'react'
import { useLang } from '../context/LangContext'
import { t, timeAgo, MONTHS } from '../i18n'

function formatDay(dateStr, lang) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  if (dateStr === todayStr) return t(lang, 'today')
  if (dateStr === yesterdayStr) return t(lang, 'yesterday')
  const [, m, d] = dateStr.split('-')
  const monthAbbr = MONTHS[lang][parseInt(m) - 1].slice(0, 3)
  return lang === 'es'
    ? `${parseInt(d)} ${monthAbbr.toLowerCase()}`
    : `${monthAbbr} ${parseInt(d)}`
}

export default function ActivityPanel({ open, onClose, actividades, currentUserId, usuarios }) {
  const { lang } = useLang()

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function actorName(actorId) {
    if (!actorId) return '—'
    if (actorId === currentUserId) return t(lang, 'you')
    return usuarios.find(u => u.id === actorId)?.nombre ?? '?'
  }

  const grouped = useMemo(() => {
    const groups = []
    let currentDay = null
    for (const a of actividades) {
      const day = a.creado_en.slice(0, 10)
      if (day !== currentDay) {
        currentDay = day
        groups.push({ day, items: [] })
      }
      groups[groups.length - 1].items.push(a)
    }
    return groups
  }, [actividades])

  return (
    <>
      {open && <div className="panel-overlay" onClick={onClose} />}
      <aside className={`activity-panel${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="panel-header">
          <h2 className="panel-title">{t(lang, 'activity_title')}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="panel-body">
          {actividades.length === 0 ? (
            <p className="empty-text" style={{ paddingTop: '0.75rem' }}>{t(lang, 'no_activity')}</p>
          ) : (
            grouped.map(group => (
              <div key={group.day}>
                <div className="activity-day-header">{formatDay(group.day, lang)}</div>
                {group.items.map(a => (
                  <div key={a.id} className="activity-item">
                    <div className="activity-meta">
                      <span className="activity-actor">{actorName(a.actor_id)}</span>
                      <span className="activity-time">{timeAgo(a.creado_en, lang)}</span>
                    </div>
                    <div className="activity-text">{a.resumen}</div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
