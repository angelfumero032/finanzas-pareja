import { useLang } from '../context/LangContext'
import { t, timeAgo } from '../i18n'

export default function ActivityPanel({ open, onClose, actividades, currentUserId, usuarios }) {
  const { lang } = useLang()

  function actorName(actorId) {
    if (!actorId) return '—'
    if (actorId === currentUserId) return t(lang, 'you')
    return usuarios.find(u => u.id === actorId)?.nombre ?? '?'
  }

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
            <p className="empty-text">{t(lang, 'no_activity')}</p>
          ) : (
            actividades.map(a => (
              <div key={a.id} className="activity-item">
                <div className="activity-actor">{actorName(a.actor_id)}</div>
                <div className="activity-text">{a.resumen}</div>
                <div className="activity-time">{timeAgo(a.creado_en, lang)}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
