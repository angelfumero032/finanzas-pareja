import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { t } from '../i18n'

// Hucha común: fondo de ahorro compartido + objetivos.
// Resiliente: si la migración 004 no está aplicada, la sección no se muestra.
export default function AhorroSection({ lang, hogarId, userId, fmt, balance, anio, mes, isCurrentMonth, showToast, categorias = [], order, onMoveUp, onMoveDown, onTotals }) {
  const [available, setAvailable] = useState(true) // tables exist?
  const [aportes, setAportes] = useState([])       // all-time
  const [objetivos, setObjetivos] = useState([])
  const [loading, setLoading] = useState(true)

  // Contribute form
  const [showAporte, setShowAporte] = useState(false)
  const [aporteImporte, setAporteImporte] = useState('')
  const [aporteObjetivo, setAporteObjetivo] = useState('')
  const [aporteNota, setAporteNota] = useState('')

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [goalNombre, setGoalNombre] = useState('')
  const [goalPresupuesto, setGoalPresupuesto] = useState('')
  const [goalMensual, setGoalMensual] = useState('')

  const [expanded, setExpanded] = useState(() => localStorage.getItem('ahorro_expanded') !== '0')
  function toggleExpanded() {
    setExpanded(v => { localStorage.setItem('ahorro_expanded', v ? '0' : '1'); return !v })
  }

  const load = useCallback(async () => {
    if (!hogarId) return
    setLoading(true)
    try {
      const [apRes, objRes] = await Promise.all([
        supabase.from('ahorro_aportes').select('*').eq('hogar_id', hogarId).order('fecha', { ascending: false }),
        supabase.from('objetivos').select('*').eq('hogar_id', hogarId).eq('activo', true).order('orden').order('creado_en'),
      ])
      if (apRes.error || objRes.error) { setAvailable(false); return }
      setAportes(apRes.data ?? [])
      setObjetivos(objRes.data ?? [])
      setAvailable(true)
    } finally {
      setLoading(false)
    }
  }, [hogarId])
  useEffect(() => { load() }, [load])

  // Realtime sync between partners
  useEffect(() => {
    if (!hogarId || !available) return
    const channel = supabase
      .channel(`ahorro-rt-${hogarId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ahorro_aportes', filter: `hogar_id=eq.${hogarId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objetivos', filter: `hogar_id=eq.${hogarId}` }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [hogarId, available, load])

  const totalAhorrado = useMemo(() => aportes.reduce((s, a) => s + Number(a.importe), 0), [aportes])
  const ahorradoEsteMes = useMemo(
    () => aportes.filter(a => a.anio === anio && a.mes === mes).reduce((s, a) => s + Number(a.importe), 0),
    [aportes, anio, mes]
  )
  // Informar al padre (resumen copiado, etc.)
  useEffect(() => {
    if (available) onTotals?.({ total: totalAhorrado, mesActual: ahorradoEsteMes })
  }, [available, totalAhorrado, ahorradoEsteMes, onTotals])

  const aportadoPorObjetivo = useMemo(() => {
    const m = {}
    aportes.forEach(a => { if (a.objetivo_id) m[a.objetivo_id] = (m[a.objetivo_id] ?? 0) + Number(a.importe) })
    return m
  }, [aportes])

  async function handleAportar(e) {
    e.preventDefault()
    const n = parseFloat(String(aporteImporte).replace(',', '.'))
    if (isNaN(n) || n === 0) return
    const { error } = await supabase.from('ahorro_aportes').insert({
      hogar_id: hogarId,
      objetivo_id: aporteObjetivo || null,
      importe: n,
      nota: aporteNota.trim() || null,
      creado_por: userId ?? null,
    })
    if (error) { showToast(t(lang, 'save_error'), 'error'); return }
    // El aporte cuenta en el balance del mes: se registra como movimiento
    // (gasto si entra en la hucha, ingreso si se retira)
    const ahorroCat = categorias.find(c => c.tipo === 'gasto' && /^ahorro$/i.test(c.nombre.trim()))
    const objetivoNombre = aporteObjetivo ? objetivos.find(o => o.id === aporteObjetivo)?.nombre : null
    await supabase.from('movimientos').insert({
      hogar_id: hogarId,
      tipo: n > 0 ? 'gasto' : 'ingreso',
      importe: Math.abs(n),
      fecha: new Date().toISOString().slice(0, 10),
      categoria_id: n > 0 ? (ahorroCat?.id ?? null) : null,
      concepto: n > 0
        ? `🐷 ${objetivoNombre ?? (lang === 'es' ? 'Hucha común' : 'Shared pot')}`
        : `🐷 ${lang === 'es' ? 'Retirada de la hucha' : 'Pot withdrawal'}`,
      nota: aporteNota.trim() || null,
      creado_por: userId ?? null,
    })
    setShowAporte(false); setAporteImporte(''); setAporteObjetivo(''); setAporteNota('')
    showToast(t(lang, 'saved_ok'))
    load()
  }

  async function handleSaveGoal(e) {
    e.preventDefault()
    const nombre = goalNombre.trim()
    if (!nombre) return
    const presupuesto = parseFloat(String(goalPresupuesto).replace(',', '.'))
    const mensual = parseFloat(String(goalMensual).replace(',', '.'))
    const row = {
      nombre,
      presupuesto: isNaN(presupuesto) || presupuesto <= 0 ? null : presupuesto,
      aporte_mensual: isNaN(mensual) || mensual <= 0 ? null : mensual,
    }
    const { error } = editGoal
      ? await supabase.from('objetivos').update(row).eq('id', editGoal.id)
      : await supabase.from('objetivos').insert({ ...row, hogar_id: hogarId })
    if (error) { showToast(t(lang, 'save_error'), 'error'); return }
    setShowGoalForm(false); setEditGoal(null); setGoalNombre(''); setGoalPresupuesto(''); setGoalMensual('')
    showToast(t(lang, 'saved_ok'))
    load()
  }

  async function handleArchiveGoal(goal) {
    const ok = window.confirm(lang === 'es'
      ? `¿Archivar el objetivo "${goal.nombre}"? Lo aportado se mantiene en la hucha.`
      : `Archive the goal "${goal.nombre}"? Contributions stay in the pot.`)
    if (!ok) return
    const { error } = await supabase.from('objetivos').update({ activo: false }).eq('id', goal.id)
    if (error) { showToast(t(lang, 'save_error'), 'error'); return }
    load()
  }

  function openGoalForm(goal = null) {
    setEditGoal(goal)
    setGoalNombre(goal?.nombre ?? '')
    setGoalPresupuesto(goal?.presupuesto ? String(goal.presupuesto) : '')
    setGoalMensual(goal?.aporte_mensual ? String(goal.aporte_mensual) : '')
    setShowGoalForm(true)
  }

  if (!available || (loading && aportes.length === 0 && objetivos.length === 0)) return null

  // El balance ya descuenta los aportes (se registran como movimiento)
  const puedeAhorrar = isCurrentMonth && balance > 0 ? balance : 0
  const es = lang === 'es'

  return (
    <section className="section section-ahorro" style={order ? { order } : undefined}>
      <div className="section-header">
        <h2 className="section-title">
          <span aria-hidden="true">🐷</span> {es ? 'Hucha común' : 'Shared pot'}
        </h2>
        <div className="section-header-actions">
          <button className="btn-sm btn-pot" onClick={() => setShowAporte(v => !v)}>
            {es ? '+ Aportar' : '+ Add to pot'}
          </button>
          {onMoveUp && <button className="btn-icon section-move-btn" onClick={onMoveUp} title={es ? 'Subir sección' : 'Move up'}>↑</button>}
          {onMoveDown && <button className="btn-icon section-move-btn" onClick={onMoveDown} title={es ? 'Bajar sección' : 'Move down'}>↓</button>}
          <button className="btn-icon" onClick={toggleExpanded} aria-expanded={expanded}>
            {expanded ? '▾' : '▸'}
          </button>
        </div>
      </div>

      <div className="ahorro-totals">
        <div className="ahorro-total-main">
          <span className="ahorro-total-label">{es ? 'Ahorrado en total' : 'Total saved'}</span>
          <span className="ahorro-total-value">{fmt(totalAhorrado)}</span>
        </div>
        <div className="ahorro-total-side">
          <span className={`ahorro-mes ${ahorradoEsteMes > 0 ? 'delta-pos' : ''}`}>
            {ahorradoEsteMes !== 0 ? `${ahorradoEsteMes > 0 ? '+' : ''}${fmt(ahorradoEsteMes)}` : '—'}
            {' '}{es ? 'este mes' : 'this month'}
          </span>
          {puedeAhorrar > 0.5 && (
            <button
              className="ahorro-hint-btn"
              onClick={() => { setAporteImporte(puedeAhorrar.toFixed(2)); setShowAporte(true) }}
              title={es ? 'Balance disponible este mes — decides tú si lo aportas' : 'Available balance this month — your call'}
            >
              {es ? `Podríais guardar ${fmt(puedeAhorrar)}` : `You could set aside ${fmt(puedeAhorrar)}`}
            </button>
          )}
        </div>
      </div>

      {showAporte && (
        <form className="ahorro-form" onSubmit={handleAportar}>
          <input
            className="ahorro-input"
            type="number"
            step="0.01"
            placeholder={es ? 'Importe € (negativo = retirar)' : 'Amount € (negative = withdraw)'}
            value={aporteImporte}
            onChange={e => setAporteImporte(e.target.value)}
            autoFocus
          />
          {objetivos.length > 0 && (
            <select className="ahorro-input" value={aporteObjetivo} onChange={e => setAporteObjetivo(e.target.value)}>
              <option value="">{es ? 'Hucha general' : 'General pot'}</option>
              {objetivos.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          )}
          <input
            className="ahorro-input"
            type="text"
            maxLength={60}
            placeholder={es ? 'Nota (opcional)' : 'Note (optional)'}
            value={aporteNota}
            onChange={e => setAporteNota(e.target.value)}
          />
          <div className="ahorro-form-actions">
            <button type="submit" className="btn-sm btn-primary">{t(lang, 'save')}</button>
            <button type="button" className="btn-sm btn-secondary" onClick={() => setShowAporte(false)}>{t(lang, 'cancel')}</button>
          </div>
        </form>
      )}

      {expanded && (
        <>
          {/* Objetivos */}
          <div className="goals-header">
            <span className="goals-title">{es ? 'Objetivos' : 'Goals'}</span>
            <button className="btn-sm btn-secondary" onClick={() => openGoalForm()}>
              {es ? '+ Objetivo' : '+ Goal'}
            </button>
          </div>

          {showGoalForm && (
            <form className="ahorro-form" onSubmit={handleSaveGoal}>
              <input
                className="ahorro-input"
                type="text"
                maxLength={50}
                placeholder={es ? 'Nombre — ej. Vacaciones, Coche…' : 'Name — e.g. Holidays, Car…'}
                value={goalNombre}
                onChange={e => setGoalNombre(e.target.value)}
                autoFocus
                required
              />
              <input
                className="ahorro-input"
                type="number"
                step="0.01"
                min="0"
                placeholder={es ? 'Presupuesto objetivo € (opcional)' : 'Target amount € (optional)'}
                value={goalPresupuesto}
                onChange={e => setGoalPresupuesto(e.target.value)}
              />
              <input
                className="ahorro-input"
                type="number"
                step="0.01"
                min="0"
                placeholder={es ? 'Aportación mensual € (opcional)' : 'Monthly contribution € (optional)'}
                value={goalMensual}
                onChange={e => setGoalMensual(e.target.value)}
              />
              <div className="ahorro-form-actions">
                <button type="submit" className="btn-sm btn-primary">{t(lang, 'save')}</button>
                <button type="button" className="btn-sm btn-secondary" onClick={() => { setShowGoalForm(false); setEditGoal(null) }}>{t(lang, 'cancel')}</button>
                {editGoal && (
                  <button type="button" className="btn-sm btn-secondary" onClick={() => handleArchiveGoal(editGoal)}>
                    {es ? 'Archivar' : 'Archive'}
                  </button>
                )}
              </div>
            </form>
          )}

          {objetivos.length === 0 && !showGoalForm && (
            <p className="empty-text">
              {es
                ? 'Cread un objetivo (vacaciones, colchón, un capricho) y aportad a vuestro ritmo.'
                : 'Create a goal (holidays, cushion, a treat) and contribute at your own pace.'}
            </p>
          )}

          {objetivos.map(o => {
            const saved = aportadoPorObjetivo[o.id] ?? 0
            const target = Number(o.presupuesto) || 0
            const pct = target > 0 ? Math.min(100, saved / target * 100) : null
            const done = target > 0 && saved >= target
            const monthsLeft = target > 0 && o.aporte_mensual > 0 && !done
              ? Math.ceil((target - saved) / Number(o.aporte_mensual))
              : null
            return (
              <div key={o.id} className="goal-row">
                <div className="goal-row-top">
                  <button className="goal-name" onClick={() => openGoalForm(o)} title={es ? 'Editar objetivo' : 'Edit goal'}>
                    {done ? '🎉 ' : ''}{o.nombre}
                  </button>
                  <span className="goal-amounts">
                    <strong>{fmt(saved)}</strong>
                    {target > 0 && <span className="goal-target"> / {fmt(target)}</span>}
                  </span>
                  <button
                    className="goal-contribute-btn"
                    onClick={() => {
                      setAporteObjetivo(o.id)
                      setAporteImporte(o.aporte_mensual ? String(o.aporte_mensual) : '')
                      setShowAporte(true)
                    }}
                    title={es ? 'Aportar a este objetivo' : 'Contribute to this goal'}
                  >+</button>
                </div>
                {pct !== null && (
                  <div className="goal-bar-wrap">
                    <div className="goal-bar-track">
                      <div className={`goal-bar-fill${done ? ' goal-bar-done' : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="goal-pct">{Math.round(pct)}%</span>
                  </div>
                )}
                {(o.aporte_mensual > 0 || monthsLeft) && (
                  <span className="goal-hint">
                    {o.aporte_mensual > 0 && (es ? `${fmt(o.aporte_mensual)}/mes` : `${fmt(o.aporte_mensual)}/mo`)}
                    {monthsLeft && ` · ${es ? `~${monthsLeft} meses para llegar` : `~${monthsLeft} months to go`}`}
                  </span>
                )}
              </div>
            )
          })}

          {/* Últimos aportes */}
          {aportes.length > 0 && (
            <div className="aportes-recent">
              {aportes.slice(0, 5).map(a => (
                <div key={a.id} className="aporte-row">
                  <span className="aporte-fecha">{a.fecha}</span>
                  <span className="aporte-desc">
                    {a.objetivo_id ? (objetivos.find(o => o.id === a.objetivo_id)?.nombre ?? (es ? 'Objetivo' : 'Goal')) : (es ? 'Hucha general' : 'General pot')}
                    {a.nota ? ` · ${a.nota}` : ''}
                  </span>
                  <span className={`aporte-importe ${Number(a.importe) >= 0 ? 'delta-pos' : 'delta-neg'}`}>
                    {Number(a.importe) >= 0 ? '+' : ''}{fmt(Number(a.importe))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
