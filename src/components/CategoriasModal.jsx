import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { t } from '../i18n'

const CAT_PALETTE = [
  '#6366f1','#8b5cf6','#a78bfa','#ec4899','#f472b6',
  '#ef4444','#f97316','#f59e0b','#84cc16','#10b981',
  '#14b8a6','#06b6d4','#22d3ee','#3b82f6','#64748b','#94a3b8',
]

export default function CategoriasModal({ open, onClose, lang, hogarId, onRefresh }) {
  const [allCats, setAllCats] = useState([])
  const [allSubcats, setAllSubcats] = useState([])
  const [tab, setTab] = useState('gasto')
  const [showArchived, setShowArchived] = useState(false)
  const [expandedCatId, setExpandedCatId] = useState(null)
  const [newCatNombre, setNewCatNombre] = useState('')
  const [newCatColor, setNewCatColor] = useState(CAT_PALETTE[0])
  const [newCatEmoji, setNewCatEmoji] = useState('')
  const [newSubNombre, setNewSubNombre] = useState('')
  const [saving, setSaving] = useState(null)
  const [editingCatId, setEditingCatId] = useState(null)
  const [editingSubId, setEditingSubId] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [editingColorId, setEditingColorId] = useState(null)
  const [editingEmojiId, setEditingEmojiId] = useState(null)
  const [editEmojiVal, setEditEmojiVal] = useState('')

  async function reload() {
    if (!hogarId) return
    const [cats, subs] = await Promise.all([
      supabase.from('categorias').select('*').eq('hogar_id', hogarId).order('tipo').order('orden'),
      supabase.from('subcategorias').select('*').eq('hogar_id', hogarId).order('orden'),
    ])
    if (cats.data) setAllCats(cats.data)
    if (subs.data) setAllSubcats(subs.data)
    onRefresh()
  }

  useEffect(() => {
    if (!open || !hogarId) return
    reload()
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

  async function handleAddCat(e) {
    e.preventDefault()
    const nombre = newCatNombre.trim()
    if (!nombre) return
    setSaving('new-cat')
    try {
      const maxOrden = activeCats.reduce((mx, c) => Math.max(mx, c.orden ?? 0), 0)
      const { error } = await supabase.from('categorias').insert({
        hogar_id: hogarId, nombre, tipo: tab, orden: maxOrden + 1, archivada: false,
        color: newCatColor,
        icono: newCatEmoji.trim() || null,
      })
      if (error) throw error
      setNewCatNombre('')
      setNewCatColor(CAT_PALETTE[0])
      setNewCatEmoji('')
      await reload()
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveEmoji(catId, icono) {
    setEditingEmojiId(null)
    setSaving(catId)
    try {
      const { error } = await supabase.from('categorias').update({ icono: icono || null }).eq('id', catId)
      if (error) throw error
      setAllCats(prev => prev.map(c => c.id === catId ? { ...c, icono: icono || null } : c))
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveColor(catId, color) {
    setEditingColorId(null)
    setSaving(catId)
    try {
      const { error } = await supabase.from('categorias').update({ color }).eq('id', catId)
      if (error) throw error
      setAllCats(prev => prev.map(c => c.id === catId ? { ...c, color } : c))
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  async function handleArchiveCat(id, archivada) {
    setSaving(id)
    try {
      const { error } = await supabase.from('categorias').update({ archivada }).eq('id', id)
      if (error) throw error
      setAllCats(prev => prev.map(c => c.id === id ? { ...c, archivada } : c))
      if (archivada && expandedCatId === id) setExpandedCatId(null)
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  async function handleRenameCat(id) {
    const nombre = editNombre.trim()
    setEditingCatId(null)
    if (!nombre) return
    setSaving(id)
    try {
      const { error } = await supabase.from('categorias').update({ nombre }).eq('id', id)
      if (error) throw error
      setAllCats(prev => prev.map(c => c.id === id ? { ...c, nombre } : c))
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  async function handleReorderCat(id, dir) {
    const cats = activeCats.slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    const idx = cats.findIndex(c => c.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= cats.length) return
    const a = cats[idx], b = cats[swapIdx]
    const aOrden = a.orden ?? idx, bOrden = b.orden ?? swapIdx
    await Promise.all([
      supabase.from('categorias').update({ orden: bOrden }).eq('id', a.id),
      supabase.from('categorias').update({ orden: aOrden }).eq('id', b.id),
    ])
    setAllCats(prev => prev.map(c =>
      c.id === a.id ? { ...c, orden: bOrden }
      : c.id === b.id ? { ...c, orden: aOrden }
      : c
    ))
    onRefresh()
  }

  async function handleAddSub(e, catId) {
    e.preventDefault()
    const nombre = newSubNombre.trim()
    if (!nombre) return
    setSaving('new-sub-' + catId)
    try {
      const activeSubs = allSubcats.filter(s => s.categoria_id === catId && !s.archivada)
      const maxOrden = activeSubs.reduce((mx, s) => Math.max(mx, s.orden ?? 0), 0)
      const { error } = await supabase.from('subcategorias').insert({
        hogar_id: hogarId, categoria_id: catId, nombre, orden: maxOrden + 1, archivada: false,
      })
      if (error) throw error
      setNewSubNombre('')
      await reload()
    } finally {
      setSaving(null)
    }
  }

  async function handleArchiveSub(id, archivada) {
    setSaving(id)
    try {
      const { error } = await supabase.from('subcategorias').update({ archivada }).eq('id', id)
      if (error) throw error
      setAllSubcats(prev => prev.map(s => s.id === id ? { ...s, archivada } : s))
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  async function handleRenameSub(id) {
    const nombre = editNombre.trim()
    setEditingSubId(null)
    if (!nombre) return
    setSaving(id)
    try {
      const { error } = await supabase.from('subcategorias').update({ nombre }).eq('id', id)
      if (error) throw error
      setAllSubcats(prev => prev.map(s => s.id === id ? { ...s, nombre } : s))
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card cats-modal-card" role="dialog" aria-modal="true" aria-labelledby="cats-modal-title">
        <div className="modal-header">
          <h2 id="cats-modal-title" className="modal-title">{lang === 'es' ? 'Categorías' : 'Categories'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label={t(lang, 'close')}>✕</button>
        </div>

        <div className="filter-tabs cats-type-tabs">
          {['gasto', 'ingreso'].map(tipo => (
            <button
              key={tipo}
              className={`filter-tab${tab === tipo ? ' filter-tab-active' : ''}`}
              onClick={() => { setTab(tipo); setShowArchived(false); setExpandedCatId(null); setEditingCatId(null) }}
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
          {activeCats.map(cat => {
            const activeSubs = allSubcats.filter(s => s.categoria_id === cat.id && !s.archivada)
            const archivedSubs = allSubcats.filter(s => s.categoria_id === cat.id && s.archivada)
            const isExpanded = expandedCatId === cat.id
            return (
              <div key={cat.id} className="cat-block">
                <div className="cat-row">
                  <button
                    className="cat-expand-btn"
                    onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                    title={lang === 'es' ? 'Subcategorías' : 'Subcategories'}
                  >
                    <span className="cat-expand-arrow">{isExpanded ? '▾' : '▸'}</span>
                  </button>

                  {/* Emoji icon — click to edit */}
                  {editingEmojiId === cat.id ? (
                    <input
                      className="cat-emoji-input"
                      type="text"
                      value={editEmojiVal}
                      onChange={e => setEditEmojiVal(e.target.value)}
                      autoFocus
                      maxLength={2}
                      placeholder="🏷"
                      onBlur={() => handleSaveEmoji(cat.id, editEmojiVal.trim())}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEmoji(cat.id, editEmojiVal.trim())
                        if (e.key === 'Escape') setEditingEmojiId(null)
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className={`cat-emoji-btn${cat.icono ? '' : ' cat-emoji-btn-empty'}`}
                      onClick={() => { setEditingEmojiId(cat.id); setEditEmojiVal(cat.icono ?? '') }}
                      title={t(lang, 'emoji_icon')}
                    >
                      {cat.icono || '+'}
                    </button>
                  )}

                  {/* Color dot — click to open palette */}
                  <div className="cat-color-wrap">
                    <button
                      className="cat-color-dot"
                      style={{ background: cat.color ?? '#94a3b8' }}
                      onClick={() => setEditingColorId(editingColorId === cat.id ? null : cat.id)}
                      title={t(lang, 'edit_color')}
                      type="button"
                    />
                    {editingColorId === cat.id && (
                      <div className="color-picker-popover">
                        {CAT_PALETTE.map(c => (
                          <button
                            key={c}
                            className={`color-swatch${cat.color === c ? ' color-swatch-active' : ''}`}
                            style={{ background: c }}
                            onClick={() => handleSaveColor(cat.id, c)}
                            type="button"
                            aria-label={c}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {editingCatId === cat.id ? (
                    <input
                      className="cat-edit-input"
                      type="text"
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      autoFocus
                      maxLength={40}
                      onFocus={e => e.target.select()}
                      onBlur={() => handleRenameCat(cat.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameCat(cat.id)
                        if (e.key === 'Escape') setEditingCatId(null)
                      }}
                    />
                  ) : (
                    <span className="cat-row-name">{cat.nombre}</span>
                  )}
                  <div className="cat-row-btns">
                    <button
                      className="cat-row-action cat-reorder-btn"
                      onClick={() => handleReorderCat(cat.id, -1)}
                      title={lang === 'es' ? 'Subir' : 'Move up'}
                      disabled={activeCats.indexOf(cat) === 0}
                    >↑</button>
                    <button
                      className="cat-row-action cat-reorder-btn"
                      onClick={() => handleReorderCat(cat.id, 1)}
                      title={lang === 'es' ? 'Bajar' : 'Move down'}
                      disabled={activeCats.indexOf(cat) === activeCats.length - 1}
                    >↓</button>
                    {editingCatId !== cat.id && (
                      <button
                        className="cat-row-action cat-row-edit"
                        onClick={() => { setEditingCatId(cat.id); setEditNombre(cat.nombre) }}
                        title={lang === 'es' ? 'Renombrar' : 'Rename'}
                      >✎</button>
                    )}
                    <button
                      className="cat-row-action"
                      onClick={() => handleArchiveCat(cat.id, true)}
                      disabled={saving === cat.id}
                      title={lang === 'es' ? 'Archivar' : 'Archive'}
                    >{saving === cat.id ? '…' : '−'}</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="sub-block">
                    {activeSubs.map(sub => (
                      <div key={sub.id} className="sub-row">
                        {editingSubId === sub.id ? (
                          <input
                            className="cat-edit-input"
                            type="text"
                            value={editNombre}
                            onChange={e => setEditNombre(e.target.value)}
                            autoFocus
                            maxLength={40}
                            onFocus={e => e.target.select()}
                            onBlur={() => handleRenameSub(sub.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameSub(sub.id)
                              if (e.key === 'Escape') setEditingSubId(null)
                            }}
                          />
                        ) : (
                          <span className="sub-row-name">{sub.nombre}</span>
                        )}
                        <div className="cat-row-btns">
                          {editingSubId !== sub.id && (
                            <button
                              className="cat-row-action cat-row-edit"
                              onClick={() => { setEditingSubId(sub.id); setEditNombre(sub.nombre) }}
                              title={lang === 'es' ? 'Renombrar' : 'Rename'}
                            >✎</button>
                          )}
                          <button
                            className="cat-row-action"
                            onClick={() => handleArchiveSub(sub.id, true)}
                            disabled={saving === sub.id}
                            title={lang === 'es' ? 'Archivar' : 'Archive'}
                          >{saving === sub.id ? '…' : '−'}</button>
                        </div>
                      </div>
                    ))}
                    {archivedSubs.length > 0 && (
                      <div className="sub-archived">
                        {lang === 'es' ? `${archivedSubs.length} archivada(s)` : `${archivedSubs.length} archived`}
                        {archivedSubs.map(sub => (
                          <button
                            key={sub.id}
                            className="sub-archived-item"
                            onClick={() => handleArchiveSub(sub.id, false)}
                            disabled={saving === sub.id}
                            title={lang === 'es' ? 'Restaurar' : 'Restore'}
                          >{sub.nombre} +</button>
                        ))}
                      </div>
                    )}
                    <form className="sub-add-form" onSubmit={e => handleAddSub(e, cat.id)}>
                      <input
                        className="cat-add-input"
                        type="text"
                        value={newSubNombre}
                        onChange={e => setNewSubNombre(e.target.value)}
                        placeholder={lang === 'es' ? 'Nueva subcategoría…' : 'New subcategory…'}
                        maxLength={40}
                      />
                      <button type="submit" className="btn-primary btn-sm"
                        disabled={!newSubNombre.trim() || saving === 'new-sub-' + cat.id}
                      >{saving === 'new-sub-' + cat.id ? '…' : '+'}</button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <form className="cat-add-form" onSubmit={handleAddCat}>
          <div className="cat-add-row">
            <input
              className="cat-emoji-input cat-emoji-input-new"
              type="text"
              value={newCatEmoji}
              onChange={e => setNewCatEmoji(e.target.value)}
              placeholder="🏷"
              maxLength={2}
              title={t(lang, 'emoji_icon')}
            />
            <div className="cat-color-wrap">
              <button
                type="button"
                className="cat-color-dot"
                style={{ background: newCatColor }}
                onClick={() => setEditingColorId(editingColorId === 'new' ? null : 'new')}
                title={t(lang, 'edit_color')}
              />
              {editingColorId === 'new' && (
                <div className="color-picker-popover color-picker-popover-up">
                  {CAT_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch${newCatColor === c ? ' color-swatch-active' : ''}`}
                      style={{ background: c }}
                      onClick={() => { setNewCatColor(c); setEditingColorId(null) }}
                      aria-label={c}
                    />
                  ))}
                </div>
              )}
            </div>
            <input
              className="cat-add-input"
              type="text"
              value={newCatNombre}
              onChange={e => setNewCatNombre(e.target.value)}
              placeholder={lang === 'es' ? 'Nueva categoría…' : 'New category…'}
              maxLength={40}
            />
            <button type="submit" className="btn-primary btn-sm"
              disabled={!newCatNombre.trim() || saving === 'new-cat'}
            >{saving === 'new-cat' ? '…' : (lang === 'es' ? 'Añadir' : 'Add')}</button>
          </div>
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
                  onClick={() => handleArchiveCat(cat.id, false)}
                  disabled={saving === cat.id}
                  title={lang === 'es' ? 'Restaurar' : 'Restore'}
                >{saving === cat.id ? '…' : '+'}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
