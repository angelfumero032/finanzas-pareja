import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { t } from '../i18n'

export default function CategoriasModal({ open, onClose, lang, hogarId, onRefresh }) {
  const [allCats, setAllCats] = useState([])
  const [tab, setTab] = useState('gasto')
  const [showArchived, setShowArchived] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [saving, setSaving] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editNombre, setEditNombre] = useState('')

  useEffect(() => {
    if (!open || !hogarId) return
    supabase
      .from('categorias')
      .select('*')
      .eq('hogar_id', hogarId)
      .order('tipo')
      .order('orden')
      .then(({ data }) => { if (data) setAllCats(data) })
  }, [open, hogarId])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const activeCats = allCats.filter(c => c.tipo === tab && !c.archivada)
  const archivedCats = allCats.filter(c => c.tipo === tab && c.archivada)

  async function handleAdd(e) {
    e.preventDefault()
    const nombre = newNombre.trim()
    if (!nombre) return
    setSaving('new')
    try {
      const maxOrden = activeCats.reduce((mx, c) => Math.max(mx, c.orden ?? 0), 0)
      const { error } = await supabase.from('categorias').insert({
        hogar_id: hogarId,
        nombre,
        tipo: tab,
        orden: maxOrden + 1,
        archivada: false,
      })
      if (error) throw error
      setNewNombre('')
      const { data } = await supabase.from('categorias').select('*').eq('hogar_id', hogarId).order('tipo').order('orden')
      if (data) setAllCats(data)
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  async function handleArchive(id, archivada) {
    setSaving(id)
    try {
      const { error } = await supabase.from('categorias').update({ archivada }).eq('id', id)
      if (error) throw error
      setAllCats(prev => prev.map(c => c.id === id ? { ...c, archivada } : c))
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  async function handleRename(id) {
    const nombre = editNombre.trim()
    if (!nombre) { setEditingId(null); return }
    setSaving(id)
    try {
      const { error } = await supabase.from('categorias').update({ nombre }).eq('id', id)
      if (error) throw error
      setAllCats(prev => prev.map(c => c.id === id ? { ...c, nombre } : c))
      setEditingId(null)
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card cats-modal-card">
        <div className="modal-header">
          <h2 className="modal-title">{lang === 'es' ? 'Categorías' : 'Categories'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="filter-tabs cats-type-tabs">
          {['gasto', 'ingreso'].map(tipo => (
            <button
              key={tipo}
              className={`filter-tab${tab === tipo ? ' filter-tab-active' : ''}`}
              onClick={() => { setTab(tipo); setShowArchived(false); setEditingId(null) }}
            >
              {tipo === 'gasto' ? t(lang, 'expense') : t(lang, 'income')}
              <span className="tab-count">
                {allCats.filter(c => c.tipo === tipo && !c.archivada).length}
              </span>
            </button>
          ))}
        </div>

        <div className="cats-list">
          {activeCats.length === 0 && (
            <p className="empty-text">{lang === 'es' ? 'Sin categorías activas.' : 'No active categories.'}</p>
          )}
          {activeCats.map(cat => (
            <div key={cat.id} className="cat-row">
              {editingId === cat.id ? (
                <input
                  className="cat-edit-input"
                  type="text"
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  autoFocus
                  maxLength={40}
                  onFocus={e => e.target.select()}
                  onBlur={() => handleRename(cat.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(cat.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
              ) : (
                <button
                  className="cat-row-name"
                  onClick={() => { setEditingId(cat.id); setEditNombre(cat.nombre) }}
                  title={lang === 'es' ? 'Pulsa para renombrar' : 'Click to rename'}
                >
                  {cat.nombre}
                </button>
              )}
              <button
                className="cat-row-action"
                onClick={() => handleArchive(cat.id, true)}
                disabled={saving === cat.id}
                title={lang === 'es' ? 'Archivar' : 'Archive'}
              >
                {saving === cat.id ? '…' : '−'}
              </button>
            </div>
          ))}
        </div>

        <form className="cat-add-form" onSubmit={handleAdd}>
          <input
            className="cat-add-input"
            type="text"
            value={newNombre}
            onChange={e => setNewNombre(e.target.value)}
            placeholder={lang === 'es' ? 'Nueva categoría…' : 'New category…'}
            maxLength={40}
          />
          <button type="submit" className="btn-primary btn-sm" disabled={!newNombre.trim() || saving === 'new'}>
            {saving === 'new' ? '…' : (lang === 'es' ? 'Añadir' : 'Add')}
          </button>
        </form>

        {archivedCats.length > 0 && (
          <div className="cats-archived-section">
            <button className="cats-archived-toggle" onClick={() => setShowArchived(s => !s)}>
              {lang === 'es' ? `Archivadas (${archivedCats.length})` : `Archived (${archivedCats.length})`}
              {' '}{showArchived ? '▲' : '▼'}
            </button>
            {showArchived && archivedCats.map(cat => (
              <div key={cat.id} className="cat-row cat-row-dim">
                <span className="cat-row-name cat-row-name-dim">{cat.nombre}</span>
                <button
                  className="cat-row-action cat-row-action-restore"
                  onClick={() => handleArchive(cat.id, false)}
                  disabled={saving === cat.id}
                  title={lang === 'es' ? 'Restaurar' : 'Restore'}
                >
                  {saving === cat.id ? '…' : '+'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
