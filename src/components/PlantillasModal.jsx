import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { t } from '../i18n'

const FREQ_OPTIONS = ['mensual', 'bimestral', 'trimestral', 'semestral', 'anual']
const FREQ_PERIOD = { mensual: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 }

export default function PlantillasModal({ open, onClose, lang, hogarId, categorias, subcategorias, onRefresh }) {
  const [plantillas, setPlantillas] = useState([])
  const [saving, setSaving] = useState(null)
  const [editingId, setEditingId] = useState(null)

  // New template form state
  const [newNombre, setNewNombre] = useState('')
  const [newImporte, setNewImporte] = useState('')
  const [newCatId, setNewCatId] = useState('')
  const [newSubcatId, setNewSubcatId] = useState('')
  const [newDia, setNewDia] = useState(1)
  const [newNota, setNewNota] = useState('')
  const [newFrecuencia, setNewFrecuencia] = useState('mensual')
  const [newMesInicio, setNewMesInicio] = useState(new Date().getMonth() + 1)

  // Inline edit state
  const [editData, setEditData] = useState({})

  async function reload() {
    if (!hogarId) return
    const { data } = await supabase
      .from('plantillas_fijas')
      .select('*')
      .eq('hogar_id', hogarId)
      .order('orden')
      .order('creado_en')
    if (data) setPlantillas(data)
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

  const catsFiltradas = categorias.filter(c => c.tipo === 'gasto')

  // Monthly-equivalent total for active templates
  const totalMensualEquiv = plantillas
    .filter(p => p.activa)
    .reduce((s, p) => s + Number(p.importe) / (FREQ_PERIOD[p.frecuencia ?? 'mensual'] ?? 1), 0)

  async function handleAdd(e) {
    e.preventDefault()
    const imp = parseFloat(newImporte)
    if (!newNombre.trim() || !imp || imp <= 0) return
    setSaving('new')
    try {
      const maxOrden = plantillas.reduce((mx, p) => Math.max(mx, p.orden ?? 0), 0)
      const { error } = await supabase.from('plantillas_fijas').insert({
        hogar_id: hogarId,
        nombre: newNombre.trim(),
        importe: imp,
        categoria_id: newCatId || null,
        subcategoria_id: newSubcatId || null,
        dia_mes: newDia,
        nota: newNota.trim() || null,
        activa: true,
        orden: maxOrden + 1,
        frecuencia: newFrecuencia,
        mes_inicio: newMesInicio,
      })
      if (error) throw error
      setNewNombre(''); setNewImporte(''); setNewCatId('')
      setNewSubcatId(''); setNewDia(1); setNewNota('')
      setNewFrecuencia('mensual'); setNewMesInicio(new Date().getMonth() + 1)
      await reload()
      onRefresh?.()
    } finally {
      setSaving(null)
    }
  }

  async function handleToggleActiva(id, activa) {
    setSaving(id)
    try {
      await supabase.from('plantillas_fijas').update({ activa }).eq('id', id)
      setPlantillas(prev => prev.map(p => p.id === id ? { ...p, activa } : p))
      onRefresh?.()
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(lang === 'es' ? '¿Eliminar esta plantilla?' : 'Delete this template?')) return
    setSaving(id)
    try {
      await supabase.from('plantillas_fijas').delete().eq('id', id)
      setPlantillas(prev => prev.filter(p => p.id !== id))
      onRefresh?.()
    } finally {
      setSaving(null)
    }
  }

  function startEdit(p) {
    setEditingId(p.id)
    setEditData({
      nombre: p.nombre,
      importe: String(p.importe),
      categoria_id: p.categoria_id ?? '',
      subcategoria_id: p.subcategoria_id ?? '',
      dia_mes: p.dia_mes ?? 1,
      nota: p.nota ?? '',
      frecuencia: p.frecuencia ?? 'mensual',
      mes_inicio: p.mes_inicio ?? 1,
    })
  }

  async function handleSaveEdit(id) {
    const imp = parseFloat(editData.importe)
    if (!editData.nombre.trim() || !imp || imp <= 0) { setEditingId(null); return }
    setSaving(id)
    try {
      await supabase.from('plantillas_fijas').update({
        nombre: editData.nombre.trim(),
        importe: imp,
        categoria_id: editData.categoria_id || null,
        subcategoria_id: editData.subcategoria_id || null,
        dia_mes: editData.dia_mes,
        nota: editData.nota.trim() || null,
        frecuencia: editData.frecuencia,
        mes_inicio: editData.mes_inicio,
      }).eq('id', id)
      setPlantillas(prev => prev.map(p => p.id === id ? {
        ...p, ...editData,
        importe: imp,
        categoria_id: editData.categoria_id || null,
        subcategoria_id: editData.subcategoria_id || null,
      } : p))
      setEditingId(null)
      onRefresh?.()
    } finally {
      setSaving(null)
    }
  }

  function catName(id) { return categorias.find(c => c.id === id)?.nombre ?? '—' }
  function subcatName(id) { return subcategorias.find(s => s.id === id)?.nombre ?? '' }
  const fmtImp = n => Number(n).toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: 'EUR' })
  const newSubcatsFiltradas = subcategorias.filter(s => s.categoria_id === newCatId)
  const editSubcatsFiltradas = subcategorias.filter(s => s.categoria_id === (editData.categoria_id || ''))

  const freqLabel = (f) => t(lang, `freq_${f ?? 'mensual'}`)
  const monthNames = lang === 'es'
    ? ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card plantillas-modal-card">
        <div className="modal-header">
          <h2 className="modal-title">
            {lang === 'es' ? 'Gastos fijos recurrentes' : 'Recurring fixed expenses'}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label={t(lang, 'close')}>✕</button>
        </div>

        <p className="plantillas-desc">
          {lang === 'es'
            ? 'Define tus gastos recurrentes. Úsalos para generar los gastos de cualquier mes con un clic.'
            : 'Define your recurring expenses. Use them to populate any month with one click.'}
        </p>

        {plantillas.filter(p => p.activa).length > 0 && (
          <div className="plantillas-total">
            <span>{lang === 'es' ? '~Equiv. mensual activo' : '~Active monthly equiv.'}</span>
            <strong>{fmtImp(totalMensualEquiv)}</strong>
          </div>
        )}

        <div className="plantillas-list">
          {plantillas.length === 0 && (
            <p className="empty-text">
              {lang === 'es' ? 'Sin plantillas todavía.' : 'No templates yet.'}
            </p>
          )}
          {plantillas.map(p => (
            <div key={p.id} className={`plantilla-row${!p.activa ? ' plantilla-row-inactive' : ''}`}>
              {editingId === p.id ? (
                <div className="plantilla-edit-form">
                  <div className="plantilla-edit-row">
                    <input
                      className="plantilla-edit-input"
                      type="text"
                      value={editData.nombre}
                      onChange={e => setEditData(d => ({ ...d, nombre: e.target.value }))}
                      placeholder={lang === 'es' ? 'Nombre…' : 'Name…'}
                      maxLength={60}
                      autoFocus
                    />
                    <input
                      className="plantilla-edit-input plantilla-edit-imp"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editData.importe}
                      onChange={e => setEditData(d => ({ ...d, importe: e.target.value }))}
                      placeholder="0.00"
                    />
                    <select
                      className="plantilla-edit-select"
                      value={editData.dia_mes}
                      onChange={e => setEditData(d => ({ ...d, dia_mes: Number(e.target.value) }))}
                      title={lang === 'es' ? 'Día del mes' : 'Day of month'}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{lang === 'es' ? `Día ${d}` : `Day ${d}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="plantilla-edit-row">
                    <select
                      className="plantilla-edit-select"
                      value={editData.frecuencia}
                      onChange={e => setEditData(d => ({ ...d, frecuencia: e.target.value }))}
                    >
                      {FREQ_OPTIONS.map(f => <option key={f} value={f}>{freqLabel(f)}</option>)}
                    </select>
                    {editData.frecuencia !== 'mensual' && (
                      <select
                        className="plantilla-edit-select"
                        value={editData.mes_inicio}
                        onChange={e => setEditData(d => ({ ...d, mes_inicio: Number(e.target.value) }))}
                        title={t(lang, 'freq_mes_inicio')}
                      >
                        {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="plantilla-edit-row">
                    <select
                      className="plantilla-edit-select"
                      value={editData.categoria_id}
                      onChange={e => setEditData(d => ({ ...d, categoria_id: e.target.value, subcategoria_id: '' }))}
                    >
                      <option value="">— {lang === 'es' ? 'Categoría' : 'Category'}</option>
                      {catsFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    {editSubcatsFiltradas.length > 0 && (
                      <select
                        className="plantilla-edit-select"
                        value={editData.subcategoria_id}
                        onChange={e => setEditData(d => ({ ...d, subcategoria_id: e.target.value }))}
                      >
                        <option value="">— {lang === 'es' ? 'Subcategoría' : 'Subcategory'}</option>
                        {editSubcatsFiltradas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                      </select>
                    )}
                    <input
                      className="plantilla-edit-input"
                      type="text"
                      value={editData.nota}
                      onChange={e => setEditData(d => ({ ...d, nota: e.target.value }))}
                      placeholder={lang === 'es' ? 'Nota…' : 'Note…'}
                      maxLength={60}
                    />
                  </div>
                  <div className="plantilla-edit-actions">
                    <button type="button" className="btn-sm btn-secondary" onClick={() => setEditingId(null)}>
                      {t(lang, 'cancel')}
                    </button>
                    <button type="button" className="btn-sm btn-primary" onClick={() => handleSaveEdit(p.id)} disabled={saving === p.id}>
                      {saving === p.id ? '…' : t(lang, 'save')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="plantilla-info">
                    <div className="plantilla-top">
                      <span className="plantilla-nombre">{p.nombre}</span>
                      <span className="plantilla-importe">{fmtImp(p.importe)}</span>
                    </div>
                    <div className="plantilla-meta">
                      {p.categoria_id && (
                        <span className="plantilla-cat">{catName(p.categoria_id)}{p.subcategoria_id ? ` · ${subcatName(p.subcategoria_id)}` : ''}</span>
                      )}
                      <span className="plantilla-dia">
                        {lang === 'es' ? `Día ${p.dia_mes ?? 1}` : `Day ${p.dia_mes ?? 1}`}
                      </span>
                      <span className={`plantilla-freq-badge${(p.frecuencia ?? 'mensual') !== 'mensual' ? ' plantilla-freq-badge-nonmonthly' : ''}`}>
                        {freqLabel(p.frecuencia)}
                        {(p.frecuencia ?? 'mensual') !== 'mensual' && p.mes_inicio
                          ? ` · ${monthNames[(p.mes_inicio ?? 1) - 1]}`
                          : ''}
                      </span>
                      {p.nota && <span className="plantilla-nota">{p.nota}</span>}
                    </div>
                  </div>
                  <div className="plantilla-actions">
                    <button
                      type="button"
                      className={`plantilla-toggle-btn${p.activa ? ' plantilla-active' : ''}`}
                      onClick={() => handleToggleActiva(p.id, !p.activa)}
                      disabled={saving === p.id}
                      title={p.activa
                        ? (lang === 'es' ? 'Desactivar' : 'Disable')
                        : (lang === 'es' ? 'Activar' : 'Enable')}
                    >
                      {saving === p.id ? '…' : (p.activa ? '✓' : '○')}
                    </button>
                    <button
                      type="button"
                      className="cat-row-action cat-row-edit"
                      onClick={() => startEdit(p)}
                      title={lang === 'es' ? 'Editar' : 'Edit'}
                    >✎</button>
                    <button
                      type="button"
                      className="cat-row-action"
                      onClick={() => handleDelete(p.id)}
                      disabled={saving === p.id}
                      title={lang === 'es' ? 'Eliminar' : 'Delete'}
                    >×</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new template form */}
        <div className="plantilla-add-section">
          <h3 className="plantilla-add-title">
            {lang === 'es' ? 'Nueva plantilla' : 'New template'}
          </h3>
          <form onSubmit={handleAdd} className="plantilla-add-form">
            <div className="plantilla-edit-row">
              <input
                className="plantilla-edit-input"
                type="text"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                placeholder={lang === 'es' ? 'Nombre (ej. Alquiler, Spotify…)' : 'Name (e.g. Rent, Netflix…)'}
                maxLength={60}
                required
              />
              <input
                className="plantilla-edit-input plantilla-edit-imp"
                type="number"
                step="0.01"
                min="0.01"
                value={newImporte}
                onChange={e => setNewImporte(e.target.value)}
                placeholder="0.00"
                required
                inputMode="decimal"
              />
              <select
                className="plantilla-edit-select"
                value={newDia}
                onChange={e => setNewDia(Number(e.target.value))}
                title={lang === 'es' ? 'Día del mes en que se cobra' : 'Day of month when charged'}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{lang === 'es' ? `Día ${d}` : `Day ${d}`}</option>
                ))}
              </select>
            </div>
            <div className="plantilla-edit-row">
              <select
                className="plantilla-edit-select"
                value={newFrecuencia}
                onChange={e => setNewFrecuencia(e.target.value)}
              >
                {FREQ_OPTIONS.map(f => <option key={f} value={f}>{freqLabel(f)}</option>)}
              </select>
              {newFrecuencia !== 'mensual' && (
                <select
                  className="plantilla-edit-select"
                  value={newMesInicio}
                  onChange={e => setNewMesInicio(Number(e.target.value))}
                  title={t(lang, 'freq_mes_inicio')}
                >
                  {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              )}
            </div>
            <div className="plantilla-edit-row">
              <select
                className="plantilla-edit-select"
                value={newCatId}
                onChange={e => { setNewCatId(e.target.value); setNewSubcatId('') }}
              >
                <option value="">— {lang === 'es' ? 'Categoría' : 'Category'}</option>
                {catsFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {newSubcatsFiltradas.length > 0 && (
                <select
                  className="plantilla-edit-select"
                  value={newSubcatId}
                  onChange={e => setNewSubcatId(e.target.value)}
                >
                  <option value="">— {lang === 'es' ? 'Subcategoría' : 'Subcategory'}</option>
                  {newSubcatsFiltradas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              )}
              <input
                className="plantilla-edit-input"
                type="text"
                value={newNota}
                onChange={e => setNewNota(e.target.value)}
                placeholder={lang === 'es' ? 'Nota (opcional)' : 'Note (optional)'}
                maxLength={60}
              />
            </div>
            <button
              type="submit"
              className="btn-primary btn-sm"
              disabled={!newNombre.trim() || !newImporte || saving === 'new'}
              style={{ alignSelf: 'flex-end' }}
            >
              {saving === 'new' ? '…' : (lang === 'es' ? '+ Añadir plantilla' : '+ Add template')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
