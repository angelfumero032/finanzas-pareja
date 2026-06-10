import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { t } from '../i18n'
import { trCat } from '../data/catNames'

// Hucha común: fondo de ahorro compartido + objetivos.
// Resiliente: si la migración 004 no está aplicada, la sección no se muestra.
export default function AhorroSection({ lang, hogarId, userId, fmt, balance, anio, mes, isCurrentMonth, showToast, categorias = [], subcategorias = [], order, onMoveUp, onMoveDown, onTotals }) {
  const [available, setAvailable] = useState(true) // tables exist?
  const [aportes, setAportes] = useState([])       // all-time
  const [objetivos, setObjetivos] = useState([])
  const [loading, setLoading] = useState(true)

  // Contribute form (deposit)
  const [showAporte, setShowAporte] = useState(false)
  const [aporteImporte, setAporteImporte] = useState('')
  const [aporteObjetivo, setAporteObjetivo] = useState('')
  const [aporteNota, setAporteNota] = useState('')

  // Withdrawal form
  const [showRetirada, setShowRetirada] = useState(false)
  const [retiradaImporte, setRetiradaImporte] = useState('')
  const [retiradaObjetivo, setRetiradaObjetivo] = useState('')
  const [retiradaCatId, setRetiradaCatId] = useState('')
  const [retiradaSubcatId, setRetiradaSubcatId] = useState('')
  const [retiradaNota, setRetiradaNota] = useState('')

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [goalNombre, setGoalNombre] = useState('')
  const [goalPresupuesto, setGoalPresupuesto] = useState('')
  const [goalMensual, setGoalMensual] = useState('')

  // Meta de ahorro mensual
  const [metaMensual, setMetaMensual] = useState(null)
  const [editingMeta, setEditingMeta] = useState(false)
  const [metaInput, setMetaInput] = useState('')
  useEffect(() => {
    if (!hogarId) return
    const stored = localStorage.getItem(`savings_goal_${hogarId}`)
    setMetaMensual(stored ? parseFloat(stored) : null)
  }, [hogarId])
  function saveMeta(val) {
    const n = parseFloat(String(val).replace(',', '.'))
    if (!isNaN(n) && n > 0) {
      localStorage.setItem(`savings_goal_${hogarId}`, String(n))
      setMetaMensual(n)
    } else {
      localStorage.removeItem(`savings_goal_${hogarId}`)
      setMetaMensual(null)
    }
    setEditingMeta(false)
  }

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
  useEffect(() => {
    if (available) onTotals?.({ total: totalAhorrado, mesActual: ahorradoEsteMes })
  }, [available, totalAhorrado, ahorradoEsteMes, onTotals])

  const aportadoPorObjetivo = useMemo(() => {
    const m = {}
    aportes.forEach(a => { if (a.objetivo_id) m[a.objetivo_id] = (m[a.objetivo_id] ?? 0) + Number(a.importe) })
    return m
  }, [aportes])

  // Subcategorías filtradas por categoría seleccionada en el form de retirada
  const subcatsRetirada = useMemo(
    () => retiradaCatId ? subcategorias.filter(s => s.categoria_id === retiradaCatId) : [],
    [subcategorias, retiradaCatId]
  )

  function closeAporte() { setShowAporte(false); setAporteImporte(''); setAporteObjetivo(''); setAporteNota('') }
  function closeRetirada() { setShowRetirada(false); setRetiradaImporte(''); setRetiradaObjetivo(''); setRetiradaCatId(''); setRetiradaSubcatId(''); setRetiradaNota('') }

  async function handleAportar(e) {
    e.preventDefault()
    const n = parseFloat(String(aporteImporte).replace(',', '.'))
    if (isNaN(n) || n <= 0) return
    const { error } = await supabase.from('ahorro_aportes').insert({
      hogar_id: hogarId,
      objetivo_id: aporteObjetivo || null,
      importe: n,
      nota: aporteNota.trim() || null,
      creado_por: userId ?? null,
    })
    if (error) { showToast(t(lang, 'save_error'), 'error'); return }
    const ahorroCat = categorias.find(c => c.tipo === 'gasto' && /^ahorro$/i.test(c.nombre.trim()))
    const objetivoNombre = aporteObjetivo ? objetivos.find(o => o.id === aporteObjetivo)?.nombre : null
    await supabase.from('movimientos').insert({
      hogar_id: hogarId,
      tipo: 'gasto',
      importe: n,
      fecha: new Date().toISOString().slice(0, 10),
      categoria_id: ahorroCat?.id ?? null,
      concepto: `🐷 ${objetivoNombre ?? (lang === 'es' ? 'Hucha común' : 'Shared pot')}`,
      nota: aporteNota.trim() || null,
      creado_por: userId ?? null,
    })
    closeAporte()
    showToast(t(lang, 'saved_ok'))
    load()
  }

  async function handleRetirar(e) {
    e.preventDefault()
    const n = parseFloat(String(retiradaImporte).replace(',', '.'))
    if (isNaN(n) || n <= 0) return
    if (n > totalAhorrado) {
      showToast(lang === 'es' ? 'No hay suficiente en la hucha' : 'Not enough in the pot', 'error')
      return
    }
    const { error } = await supabase.from('ahorro_aportes').insert({
      hogar_id: hogarId,
      objetivo_id: retiradaObjetivo || null,
      importe: -n,
      nota: retiradaNota.trim() || null,
      creado_por: userId ?? null,
    })
    if (error) { showToast(t(lang, 'save_error'), 'error'); return }
    const objetivoNombre = retiradaObjetivo ? objetivos.find(o => o.id === retiradaObjetivo)?.nombre : null
    await supabase.from('movimientos').insert({
      hogar_id: hogarId,
      tipo: 'ingreso',
      importe: n,
      fecha: new Date().toISOString().slice(0, 10),
      categoria_id: retiradaCatId || null,
      subcategoria_id: retiradaSubcatId || null,
      concepto: `🐷 ${lang === 'es' ? 'Retirada' : 'Withdrawal'}${objetivoNombre ? ` — ${objetivoNombre}` : ''}`,
      nota: retiradaNota.trim() || null,
      creado_por: userId ?? null,
    })
    closeRetirada()
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

  const puedeAhorrar = isCurrentMonth && balance > 0 ? balance : 0
  const es = lang === 'es'
  const gastosCats = categorias.filter(c => c.tipo === 'gasto')
  const ingresosCats = categorias.filter(c => c.tipo === 'ingreso')
  const todasCats = [...gastosCats, ...ingresosCats]

  return (
    <section className="section section-ahorro" style={order ? { order } : undefined}>
      <div className="section-header">
        <h2 className="section-title">
          <span aria-hidden="true">🐷</span> {es ? 'Hucha común' : 'Shared pot'}
        </h2>
        <div className="section-header-actions">
          <button className="btn-sm btn-pot" onClick={() => { closeRetirada(); setShowAporte(v => !v) }}>
            {es ? '+ Aportar' : '+ Deposit'}
          </button>
          <button className="btn-sm btn-pot-withdraw" onClick={() => { closeAporte(); setShowRetirada(v => !v) }}>
            {es ? '− Retirar' : '− Withdraw'}
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
          <span className={`ahorro-mes ${ahorradoEsteMes > 0 ? 'delta-pos' : ahorradoEsteMes < 0 ? 'delta-neg' : ''}`}>
            {ahorradoEsteMes !== 0 ? `${ahorradoEsteMes > 0 ? '+' : ''}${fmt(ahorradoEsteMes)}` : '—'}
            {' '}{es ? 'este mes' : 'this month'}
          </span>
          {puedeAhorrar > 0.5 && (
            <button
              className="ahorro-hint-btn"
              onClick={() => { setAporteImporte(puedeAhorrar.toFixed(2)); closeRetirada(); setShowAporte(true) }}
              title={es ? 'Balance disponible este mes — decides tú si lo aportas' : 'Available balance this month — your call'}
            >
              {es ? `Podríais guardar ${fmt(puedeAhorrar)}` : `You could set aside ${fmt(puedeAhorrar)}`}
            </button>
          )}
        </div>
      </div>

      {/* Meta de ahorro mensual */}
      <div className="ahorro-meta-row">
        {editingMeta ? (
          <form className="savings-goal-form" onSubmit={e => { e.preventDefault(); saveMeta(metaInput) }}>
            <label className="savings-goal-form-label">{es ? 'Meta mensual (€):' : 'Monthly goal (€):'}</label>
            <input
              className="savings-goal-input"
              type="number"
              min="0"
              step="1"
              value={metaInput}
              onChange={e => setMetaInput(e.target.value)}
              autoFocus
              placeholder="0"
              onFocus={e => e.target.select()}
              onKeyDown={e => e.key === 'Escape' && setEditingMeta(false)}
            />
            <button type="submit" className="btn-sm btn-primary">{t(lang, 'save')}</button>
            <button type="button" className="btn-sm btn-secondary" onClick={() => setEditingMeta(false)}>{t(lang, 'cancel')}</button>
          </form>
        ) : metaMensual ? (
          <>
            <div className="savings-goal-track">
              <div
                className={`savings-goal-fill${ahorradoEsteMes >= metaMensual ? ' savings-goal-done' : ''}`}
                style={{ width: `${Math.min(100, Math.max(0, ahorradoEsteMes / metaMensual * 100))}%` }}
              />
            </div>
            <span className={`savings-goal-pct ${ahorradoEsteMes >= metaMensual ? 'delta-pos' : ''}`}>
              {ahorradoEsteMes >= metaMensual ? '✓' : `${Math.round(Math.max(0, ahorradoEsteMes) / metaMensual * 100)}%`}
            </span>
            <button
              className="savings-goal-label-btn"
              onClick={() => { setMetaInput(String(metaMensual)); setEditingMeta(true) }}
              title={es ? 'Editar meta mensual' : 'Edit monthly goal'}
            >
              {es ? `Meta del mes: ${fmt(metaMensual)}` : `Monthly goal: ${fmt(metaMensual)}`}
            </button>
          </>
        ) : (
          <button className="savings-goal-add-btn" onClick={() => { setMetaInput(''); setEditingMeta(true) }}>
            + {es ? 'Meta mensual de ahorro' : 'Monthly savings goal'}
          </button>
        )}
      </div>

      {/* ── Formulario aporte (depósito) ── */}
      {showAporte && (
        <form className="ahorro-form" onSubmit={handleAportar}>
          <div className="ahorro-form-title">{es ? 'Añadir a la hucha' : 'Deposit to pot'}</div>
          <input
            className="ahorro-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder={es ? 'Importe €' : 'Amount €'}
            value={aporteImporte}
            onChange={e => setAporteImporte(e.target.value)}
            autoFocus
            required
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
            <button type="submit" className="btn-sm btn-primary">{es ? 'Guardar aporte' : 'Save deposit'}</button>
            <button type="button" className="btn-sm btn-secondary" onClick={closeAporte}>{t(lang, 'cancel')}</button>
          </div>
        </form>
      )}

      {/* ── Formulario retirada ── */}
      {showRetirada && (
        <form className="ahorro-form ahorro-form-withdraw" onSubmit={handleRetirar}>
          <div className="ahorro-form-title ahorro-form-title-withdraw">
            {es ? 'Retirar de la hucha' : 'Withdraw from pot'}
            {totalAhorrado > 0 && (
              <span className="ahorro-form-balance">{es ? `Disponible: ${fmt(totalAhorrado)}` : `Available: ${fmt(totalAhorrado)}`}</span>
            )}
          </div>
          <input
            className="ahorro-input"
            type="number"
            step="0.01"
            min="0.01"
            max={totalAhorrado > 0 ? totalAhorrado : undefined}
            placeholder={es ? 'Importe €' : 'Amount €'}
            value={retiradaImporte}
            onChange={e => setRetiradaImporte(e.target.value)}
            autoFocus
            required
          />
          {objetivos.length > 0 && (
            <select className="ahorro-input" value={retiradaObjetivo} onChange={e => setRetiradaObjetivo(e.target.value)}>
              <option value="">{es ? 'De la hucha general' : 'From general pot'}</option>
              {objetivos.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          )}
          {/* Categoría destino — para que quede reflejado en el presupuesto */}
          <select
            className="ahorro-input"
            value={retiradaCatId}
            onChange={e => { setRetiradaCatId(e.target.value); setRetiradaSubcatId('') }}
          >
            <option value="">{es ? '— Categoría (opcional)' : '— Category (optional)'}</option>
            {todasCats.map(c => (
              <option key={c.id} value={c.id}>{trCat(c.nombre, lang)}</option>
            ))}
          </select>
          {subcatsRetirada.length > 0 && (
            <select
              className="ahorro-input"
              value={retiradaSubcatId}
              onChange={e => setRetiradaSubcatId(e.target.value)}
            >
              <option value="">{es ? '— Subcategoría (opcional)' : '— Subcategory (optional)'}</option>
              {subcatsRetirada.map(s => (
                <option key={s.id} value={s.id}>{trCat(s.nombre, lang)}</option>
              ))}
            </select>
          )}
          <input
            className="ahorro-input"
            type="text"
            maxLength={60}
            placeholder={es ? 'Para qué (nota, opcional)' : 'Purpose (note, optional)'}
            value={retiradaNota}
            onChange={e => setRetiradaNota(e.target.value)}
          />
          <div className="ahorro-form-actions">
            <button type="submit" className="btn-sm btn-withdraw">{es ? 'Confirmar retirada' : 'Confirm withdrawal'}</button>
            <button type="button" className="btn-sm btn-secondary" onClick={closeRetirada}>{t(lang, 'cancel')}</button>
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
                      closeRetirada()
                      setShowAporte(true)
                    }}
                    title={es ? 'Aportar a este objetivo' : 'Contribute to this goal'}
                  >+</button>
                  <button
                    className="goal-withdraw-btn"
                    onClick={() => {
                      setRetiradaObjetivo(o.id)
                      closeAporte()
                      setShowRetirada(true)
                    }}
                    title={es ? 'Retirar de este objetivo' : 'Withdraw from this goal'}
                  >−</button>
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

          {/* Historial de movimientos de la hucha */}
          {aportes.length > 0 && (
            <div className="aportes-recent">
              {aportes.slice(0, 8).map(a => {
                const isWithdrawal = Number(a.importe) < 0
                return (
                  <div key={a.id} className={`aporte-row${isWithdrawal ? ' aporte-row-withdrawal' : ''}`}>
                    <span className={`aporte-type-icon${isWithdrawal ? ' aporte-type-withdraw' : ' aporte-type-deposit'}`}>
                      {isWithdrawal ? '↑' : '↓'}
                    </span>
                    <span className="aporte-fecha">{a.fecha}</span>
                    <span className="aporte-desc">
                      {a.objetivo_id ? (objetivos.find(o => o.id === a.objetivo_id)?.nombre ?? (es ? 'Objetivo' : 'Goal')) : (es ? 'Hucha general' : 'General pot')}
                      {a.nota ? ` · ${a.nota}` : ''}
                    </span>
                    <span className={`aporte-importe ${Number(a.importe) >= 0 ? 'delta-pos' : 'delta-neg'}`}>
                      {Number(a.importe) >= 0 ? '+' : ''}{fmt(Number(a.importe))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}
