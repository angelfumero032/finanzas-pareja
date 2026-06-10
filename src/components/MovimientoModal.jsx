import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../context/LangContext'
import { t } from '../i18n'
import { getConceptosByCatName } from '../data/conceptos'
import { trCat } from '../data/catNames'

function evalAmount(str) {
  const clean = str.trim().replace(',', '.')
  if (!/^[0-9+\-*/.() ]+$/.test(clean) || clean === '') return null
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('return (' + clean + ')')()
    return typeof result === 'number' && isFinite(result) && result > 0
      ? Math.round(result * 100) / 100
      : null
  } catch {
    return null
  }
}

export default function MovimientoModal({
  open, onClose, onSave, onDelete, onDuplicate,
  movimiento, categorias, subcategorias,
  hogarId, userId,
  defaultTipo = 'gasto', defaultCatId = null,
  defaultImporte = '', defaultSubcatId = '', defaultNota = '', defaultConcepto = '',
  defaultFecha = null,
  gastoPorCat = {}, presupuestoPorCat = {},
  recentConceptos = [],
}) {
  const { lang } = useLang()
  const todayStr = new Date().toISOString().slice(0, 10)

  const [tipo, setTipo] = useState('gasto')
  const [importe, setImporte] = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(todayStr)
  const [catId, setCatId] = useState('')
  const [subcatId, setSubcatId] = useState('')
  const [nota, setNota] = useState('')
  const [esFijo, setEsFijo] = useState(false)
  const [pendiente, setPendiente] = useState(false)
  const [saving, setSaving] = useState(false)
  // Modo ultra-rápido: importe + concepto + categoría; el resto tras "Más opciones"
  const [showMore, setShowMore] = useState(false)

  // El teclado de iOS no debe tapar la hoja: limitar la altura al viewport visible
  const cardRef = useRef(null)
  useEffect(() => {
    if (!open || !window.visualViewport) return
    const vv = window.visualViewport
    function onResize() {
      if (cardRef.current) cardRef.current.style.maxHeight = `${Math.max(260, vv.height - 16)}px`
    }
    onResize()
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (movimiento) {
      setTipo(movimiento.tipo ?? 'gasto')
      setImporte(String(movimiento.importe ?? ''))
      setConcepto(movimiento.concepto ?? '')
      setFecha(movimiento.fecha ?? todayStr)
      setCatId(movimiento.categoria_id ?? '')
      setSubcatId(movimiento.subcategoria_id ?? '')
      setNota(movimiento.nota ?? '')
      setEsFijo(movimiento.es_fijo ?? false)
      setPendiente(movimiento.pendiente ?? false)
      setShowMore(true)
    } else {
      setShowMore(false)
      setTipo(defaultTipo)
      setImporte(defaultImporte || '')
      setConcepto(defaultConcepto || '')
      setFecha(defaultFecha || todayStr)
      setCatId(defaultCatId || '')
      setSubcatId(defaultSubcatId || '')
      setNota(defaultNota || '')
      setEsFijo(false)
      setPendiente(false)
    }
  }, [open, movimiento?.id, defaultTipo, defaultCatId, defaultImporte, defaultSubcatId, defaultNota, defaultConcepto, defaultFecha])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const catsFiltradas = categorias.filter(c => c.tipo === tipo)
  const subcatsFiltradas = subcategorias.filter(s => s.categoria_id === catId)
  const catName = catsFiltradas.find(c => c.id === catId)?.nombre ?? ''

  // Sugerencias: estáticas de la categoría + recientes del hogar (dedup)
  const sugerencias = useMemo(() => {
    const estaticas = getConceptosByCatName(catName)
    const recientes = catId
      ? recentConceptos.filter(r => r.categoria_id === catId).map(r => r.concepto)
      : recentConceptos.map(r => r.concepto)
    const all = [...new Set([...recientes, ...estaticas])]
    return all
  }, [catName, catId, recentConceptos])

  // Category prediction from concepto — find the most-used cat for this concepto
  const suggestedCatId = useMemo(() => {
    if (!concepto.trim() || catId || tipo !== 'gasto') return null
    const q = concepto.trim().toLowerCase()
    const freq = {}
    recentConceptos
      .filter(r => r.concepto?.toLowerCase().includes(q) || q.includes(r.concepto?.toLowerCase() ?? ''))
      .forEach(r => { if (r.categoria_id) freq[r.categoria_id] = (freq[r.categoria_id] ?? 0) + 1 })
    const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]
    return best ? best[0] : null
  }, [concepto, catId, tipo, recentConceptos])

  // Chips: top-6 más frecuentes para la categoría seleccionada
  const chips = useMemo(() => {
    const freq = {}
    const relevant = catId
      ? recentConceptos.filter(r => r.categoria_id === catId)
      : []
    relevant.forEach(r => { freq[r.concepto] = (freq[r.concepto] ?? 0) + 1 })
    const fromRecent = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([c]) => c)
    if (fromRecent.length >= 4) return fromRecent
    // completar con estáticos si hay pocos recientes
    const estaticas = getConceptosByCatName(catName)
    const combined = [...new Set([...fromRecent, ...estaticas])].slice(0, 6)
    return combined
  }, [catId, catName, recentConceptos])

  function handleTipo(newTipo) {
    setTipo(newTipo)
    setCatId('')
    setSubcatId('')
  }

  async function handleSave(e) {
    e.preventDefault()
    const imp = parseFloat(importe)
    if (!imp || imp <= 0) return
    if (tipo === 'gasto' && !concepto.trim()) return
    setSaving(true)
    try {
      const payload = {
        tipo,
        importe: imp,
        fecha,
        categoria_id: catId || null,
        subcategoria_id: subcatId || null,
        nota: nota.trim() || null,
        hogar_id: hogarId,
        creado_por: userId,
        es_fijo: tipo === 'gasto' ? esFijo : false,
        pendiente: tipo === 'gasto' ? pendiente : false,
      }
      // concepto solo si hay valor — evita error si la migración aún no se aplicó
      if (concepto.trim()) payload.concepto = concepto.trim()
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" ref={cardRef}>
        <div className="modal-header">
          <h2 className="modal-title">
            {movimiento ? t(lang, 'edit_movement') : t(lang, 'new_movement')}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label={t(lang, 'close')}>✕</button>
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

          {/* Importe */}
          <div className="field">
            <label htmlFor="m-importe">
              {t(lang, 'amount')}
              {/[+\-*/()]/.test(importe) && (() => {
                const result = evalAmount(importe)
                return result ? <span className="amount-expr-preview"> = {result.toFixed(2)}</span> : null
              })()}
            </label>
            <input
              id="m-importe"
              className="importe-hero"
              type="text"
              inputMode="decimal"
              value={importe}
              onChange={e => setImporte(e.target.value.replace(',', '.'))}
              onFocus={e => e.target.select()}
              onBlur={e => {
                const v = e.target.value
                if (/[+\-*/()]/.test(v)) {
                  const result = evalAmount(v)
                  if (result !== null) setImporte(String(result))
                }
              }}
              required
              autoFocus={!movimiento}
              placeholder="0.00"
            />
            <div className="quick-amounts">
              {[5, 10, 20, 50, 100, 200].map(v => (
                <button
                  key={v}
                  type="button"
                  className={`quick-amount-btn${importe === String(v) ? ' quick-amount-active' : ''}`}
                  onClick={() => setImporte(String(v))}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Concepto — dato de primera clase */}
          <div className="field field-concepto">
            <label htmlFor="m-concepto">{t(lang, 'concept')}</label>
            <input
              id="m-concepto"
              type="text"
              list="concepto-list"
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              maxLength={60}
              placeholder={t(lang, 'concept_placeholder')}
              autoComplete="off"
              required={tipo === 'gasto'}
            />
            <datalist id="concepto-list">
              {sugerencias.map(s => <option key={s} value={s} />)}
            </datalist>
            {chips.length > 0 && (
              <div className="concepto-chips">
                {chips.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    className={`concepto-chip${concepto === chip ? ' concepto-chip-active' : ''}`}
                    onClick={() => setConcepto(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fecha */}
          {showMore && (
          <div className="field">
            <label htmlFor="m-fecha">{t(lang, 'date')}</label>
            <input
              id="m-fecha"
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
            />
            <div className="quick-amounts">
              {(() => {
                const dayLabels = lang === 'es'
                  ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                  : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const chips = [
                  { label: t(lang, 'today'), value: todayStr },
                  { label: t(lang, 'yesterday'), value: new Date(new Date(todayStr).getTime() - 86400000).toISOString().slice(0, 10) },
                  ...[2, 3, 4].map(n => {
                    const d = new Date(new Date(todayStr).getTime() - n * 86400000)
                    return { label: dayLabels[d.getDay()], value: d.toISOString().slice(0, 10) }
                  }),
                ]
                return chips.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    className={`quick-amount-btn${fecha === value ? ' quick-amount-active' : ''}`}
                    onClick={() => setFecha(value)}
                  >
                    {label}
                  </button>
                ))
              })()}
            </div>
          </div>
          )}

          {/* Categoría */}
          <div className="field">
            <label htmlFor="m-cat">{t(lang, 'category')}</label>
            <select
              id="m-cat"
              value={catId}
              onChange={e => { setCatId(e.target.value); setSubcatId('') }}
            >
              <option value="">—</option>
              {catsFiltradas.map(c => (
                <option key={c.id} value={c.id}>{trCat(c.nombre, lang)}</option>
              ))}
            </select>
            {suggestedCatId && (() => {
              const cat = catsFiltradas.find(c => c.id === suggestedCatId)
              if (!cat) return null
              return (
                <button
                  type="button"
                  className="cat-suggest-chip"
                  onClick={() => { setCatId(suggestedCatId); setSubcatId('') }}
                >
                  ← {trCat(cat.nombre, lang)}
                </button>
              )
            })()}
            {tipo === 'gasto' && catId && (() => {
              const spent = gastoPorCat[catId] ?? 0
              const budget = presupuestoPorCat[catId] ?? 0
              if (budget <= 0) return null
              const editAdjust = movimiento?.categoria_id === catId ? Number(movimiento.importe ?? 0) : 0
              const effectiveSpent = spent - editAdjust
              const remaining = budget - effectiveSpent
              const ratio = effectiveSpent / budget
              const cls = ratio > 1 ? 'budget-hint-over' : ratio > 0.8 ? 'budget-hint-warn' : 'budget-hint-ok'
              const fmtAmt = n => Number(n).toFixed(2).replace(/\.?0+$/, '')
              return (
                <p className={`budget-hint ${cls}`}>
                  {remaining >= 0
                    ? `${Math.round(ratio * 100)}% · ${fmtAmt(remaining)}€ ${t(lang, 'budget_remaining')}`
                    : `+${fmtAmt(Math.abs(remaining))}€ ${t(lang, 'budget_over')}`}
                </p>
              )
            })()}
          </div>

          {/* Subcategoría */}
          {showMore && subcatsFiltradas.length > 0 && (
            <div className="field">
              <label htmlFor="m-subcat">{t(lang, 'subcategory')}</label>
              <select
                id="m-subcat"
                value={subcatId}
                onChange={e => setSubcatId(e.target.value)}
              >
                <option value="">—</option>
                {subcatsFiltradas.map(s => (
                  <option key={s.id} value={s.id}>{trCat(s.nombre, lang)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Nota — detalle opcional */}
          {showMore && (
          <div className="field">
            <label htmlFor="m-nota">
              {t(lang, 'note')}
              {nota.length > 80 && (
                <span className={`note-counter${nota.length >= 110 ? ' note-counter-warn' : ''}`}>
                  {120 - nota.length}
                </span>
              )}
            </label>
            <input
              id="m-nota"
              type="text"
              value={nota}
              onChange={e => setNota(e.target.value)}
              maxLength={120}
            />
          </div>
          )}

          {/* Toggles row — only for expenses */}
          {showMore && tipo === 'gasto' && (
            <div className="expense-toggles">
              <label className="fixed-toggle-label">
                <input
                  type="checkbox"
                  checked={esFijo}
                  onChange={e => { setEsFijo(e.target.checked); if (e.target.checked) setPendiente(false) }}
                  className="fixed-toggle-input"
                />
                <span className="fixed-toggle-track">
                  <span className="fixed-toggle-knob" />
                </span>
                <span className="fixed-toggle-text">
                  {t(lang, 'mark_fixed')}
                  <span className="fixed-toggle-hint">
                    {lang === 'es'
                      ? ' (alquiler, suscripciones, seguros…)'
                      : ' (rent, subscriptions, insurance…)'}
                  </span>
                </span>
              </label>
              <label className="fixed-toggle-label">
                <input
                  type="checkbox"
                  checked={pendiente}
                  onChange={e => setPendiente(e.target.checked)}
                  className="fixed-toggle-input fixed-toggle-pending"
                />
                <span className="fixed-toggle-track fixed-toggle-track-pending">
                  <span className="fixed-toggle-knob" />
                </span>
                <span className="fixed-toggle-text">
                  {t(lang, 'mark_pending')}
                  <span className="fixed-toggle-hint">
                    {lang === 'es'
                      ? ' (previsto pero aún no cargado)'
                      : ' (planned but not yet charged)'}
                  </span>
                </span>
              </label>
            </div>
          )}

          {!showMore && (
            <button
              type="button"
              className="more-options-btn"
              onClick={() => setShowMore(true)}
            >
              {lang === 'es' ? 'Más opciones (fecha, nota, fijo…) ▾' : 'More options (date, note, fixed…) ▾'}
            </button>
          )}

          <div className="modal-actions">
            {movimiento && (
              <>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => onDelete(movimiento.id)}
                >
                  {t(lang, 'delete_movement')}
                </button>
                {onDuplicate && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => onDuplicate(movimiento)}
                    title={t(lang, 'duplicate')}
                  >
                    {t(lang, 'duplicate')}
                  </button>
                )}
              </>
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
