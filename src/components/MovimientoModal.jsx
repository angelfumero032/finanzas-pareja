import { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext'
import { t } from '../i18n'

export default function MovimientoModal({ open, onClose, onSave, onDelete, movimiento, categorias, subcategorias, hogarId, userId }) {
  const { lang } = useLang()
  const todayStr = new Date().toISOString().slice(0, 10)

  const [tipo, setTipo] = useState('gasto')
  const [importe, setImporte] = useState('')
  const [fecha, setFecha] = useState(todayStr)
  const [catId, setCatId] = useState('')
  const [subcatId, setSubcatId] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (movimiento) {
      setTipo(movimiento.tipo ?? 'gasto')
      setImporte(String(movimiento.importe ?? ''))
      setFecha(movimiento.fecha ?? todayStr)
      setCatId(movimiento.categoria_id ?? '')
      setSubcatId(movimiento.subcategoria_id ?? '')
      setNota(movimiento.nota ?? '')
    } else {
      setTipo('gasto')
      setImporte('')
      setFecha(todayStr)
      setCatId('')
      setSubcatId('')
      setNota('')
    }
  }, [open, movimiento?.id])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const catsFiltradas = categorias.filter(c => c.tipo === tipo)
  const subcatsFiltradas = subcategorias.filter(s => s.categoria_id === catId)

  function handleTipo(newTipo) {
    setTipo(newTipo)
    setCatId('')
    setSubcatId('')
  }

  async function handleSave(e) {
    e.preventDefault()
    const imp = parseFloat(importe)
    if (!imp || imp <= 0) return
    setSaving(true)
    try {
      await onSave({
        tipo,
        importe: imp,
        fecha,
        categoria_id: catId || null,
        subcategoria_id: subcatId || null,
        nota: nota.trim() || null,
        hogar_id: hogarId,
        creado_por: userId,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">
            {movimiento ? t(lang, 'edit_movement') : t(lang, 'new_movement')}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="tipo-toggle">
            <button
              type="button"
              className={`tipo-btn${tipo === 'gasto' ? ' tipo-active tipo-gasto' : ''}`}
              onClick={() => handleTipo('gasto')}
            >
              {t(lang, 'expense')}
            </button>
            <button
              type="button"
              className={`tipo-btn${tipo === 'ingreso' ? ' tipo-active tipo-ingreso' : ''}`}
              onClick={() => handleTipo('ingreso')}
            >
              {t(lang, 'income')}
            </button>
          </div>

          <div className="field">
            <label htmlFor="m-importe">{t(lang, 'amount')}</label>
            <input
              id="m-importe"
              type="number"
              step="0.01"
              min="0.01"
              value={importe}
              onChange={e => setImporte(e.target.value)}
              required
              autoFocus={!movimiento}
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>

          <div className="field">
            <label htmlFor="m-fecha">{t(lang, 'date')}</label>
            <input
              id="m-fecha"
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
              max={todayStr}
            />
          </div>

          <div className="field">
            <label htmlFor="m-cat">{t(lang, 'category')}</label>
            <select
              id="m-cat"
              value={catId}
              onChange={e => { setCatId(e.target.value); setSubcatId('') }}
            >
              <option value="">—</option>
              {catsFiltradas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {subcatsFiltradas.length > 0 && (
            <div className="field">
              <label htmlFor="m-subcat">{t(lang, 'subcategory')}</label>
              <select
                id="m-subcat"
                value={subcatId}
                onChange={e => setSubcatId(e.target.value)}
              >
                <option value="">—</option>
                {subcatsFiltradas.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="m-nota">{t(lang, 'note')}</label>
            <input
              id="m-nota"
              type="text"
              value={nota}
              onChange={e => setNota(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="modal-actions">
            {movimiento && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => onDelete(movimiento.id)}
              >
                {t(lang, 'delete_movement')}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t(lang, 'cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '…' : t(lang, 'save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
