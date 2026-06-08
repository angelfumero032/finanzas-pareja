import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { t, MONTHS } from '../i18n'
import MovimientoModal from '../components/MovimientoModal'
import ActivityPanel from '../components/ActivityPanel'

export default function MesView() {
  const { profile } = useAuth()
  const { lang, setLang } = useLang()

  const todayDate = new Date()
  const [anio, setAnio] = useState(todayDate.getFullYear())
  const [mes, setMes] = useState(todayDate.getMonth() + 1)

  // Datos del hogar (estáticos, cargados una vez)
  const [categorias, setCategorias] = useState([])
  const [subcategorias, setSubcategorias] = useState([])
  const [usuarios, setUsuarios] = useState([])

  // Datos del mes
  const [movimientos, setMovimientos] = useState([])
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)

  // Actividad / campana
  const [actividades, setActividades] = useState([])
  const [unread, setUnread] = useState(0)
  const [showActivity, setShowActivity] = useState(false)

  // Modal de movimiento
  const [modalOpen, setModalOpen] = useState(false)
  const [editMov, setEditMov] = useState(null)

  // Edición inline de presupuesto
  const [editBudget, setEditBudget] = useState(null) // { catId }

  const hogarId = profile?.hogar_id

  const fmt = useMemo(() => {
    const f = new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', {
      style: 'currency',
      currency: 'EUR',
    })
    return (n) => f.format(n)
  }, [lang])

  // ── Carga de datos estáticos (categorías, subcategorías, perfiles del hogar) ──
  useEffect(() => {
    if (!hogarId) return
    Promise.all([
      supabase.from('categorias').select('*').eq('hogar_id', hogarId).eq('archivada', false).order('tipo').order('orden'),
      supabase.from('subcategorias').select('*').eq('hogar_id', hogarId).eq('archivada', false).order('orden'),
      supabase.from('usuarios').select('id, nombre').eq('hogar_id', hogarId),
    ]).then(([cats, subcats, usrs]) => {
      if (cats.data) setCategorias(cats.data)
      if (subcats.data) setSubcategorias(subcats.data)
      if (usrs.data) setUsuarios(usrs.data)
    })
  }, [hogarId])

  // ── Carga de datos del mes ──
  const loadMes = useCallback(async () => {
    if (!hogarId) return
    setLoading(true)
    try {
      const [movRes, preRes] = await Promise.all([
        supabase
          .from('movimientos')
          .select('*')
          .eq('hogar_id', hogarId)
          .eq('anio', anio)
          .eq('mes', mes)
          .order('fecha', { ascending: false })
          .order('creado_en', { ascending: false }),
        supabase
          .from('presupuestos')
          .select('*')
          .eq('hogar_id', hogarId)
          .eq('anio', anio)
          .eq('mes', mes),
      ])
      if (movRes.data) setMovimientos(movRes.data)
      if (preRes.data) setPresupuestos(preRes.data)
    } finally {
      setLoading(false)
    }
  }, [hogarId, anio, mes])

  useEffect(() => { loadMes() }, [loadMes])

  // ── Actividad: carga inicial + contador no leídos ──
  useEffect(() => {
    if (!hogarId || !profile?.id) return

    supabase
      .from('actividad')
      .select('*')
      .eq('hogar_id', hogarId)
      .order('creado_en', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setActividades(data) })

    supabase
      .from('actividad')
      .select('*', { count: 'exact', head: true })
      .eq('hogar_id', hogarId)
      .gt('creado_en', profile.actividad_vista_en)
      .neq('actor_id', profile.id)
      .then(({ count }) => setUnread(count ?? 0))
  }, [hogarId, profile?.id])

  // ── Realtime: actividad + movimientos ──
  // Usamos ref para que el canal no se re-suscriba al cambiar de mes
  const loadMesRef = useRef(loadMes)
  useEffect(() => { loadMesRef.current = loadMes }, [loadMes])

  useEffect(() => {
    if (!hogarId) return

    const channel = supabase
      .channel(`hogar-rt-${hogarId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'actividad', filter: `hogar_id=eq.${hogarId}` },
        (payload) => {
          setActividades(prev => [payload.new, ...prev].slice(0, 50))
          if (payload.new.actor_id !== profile?.id) {
            setUnread(n => n + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movimientos', filter: `hogar_id=eq.${hogarId}` },
        () => loadMesRef.current?.()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [hogarId, profile?.id])

  // ── Navegación de mes ──
  function prevMes() {
    if (mes === 1) { setAnio(a => a - 1); setMes(12) }
    else setMes(m => m - 1)
  }
  function nextMes() {
    if (mes === 12) { setAnio(a => a + 1); setMes(1) }
    else setMes(m => m + 1)
  }
  const isCurrentMonth = anio === todayDate.getFullYear() && mes === todayDate.getMonth() + 1

  // ── Actividad: abrir panel + marcar como leído ──
  async function handleOpenActivity() {
    setShowActivity(true)
    if (unread > 0 && profile?.id) {
      await supabase
        .from('usuarios')
        .update({ actividad_vista_en: new Date().toISOString() })
        .eq('id', profile.id)
      setUnread(0)
    }
  }

  // ── CRUD movimientos ──
  async function handleSaveMov(data) {
    if (editMov?.id) {
      const { hogar_id, creado_por, ...fields } = data
      await supabase.from('movimientos').update(fields).eq('id', editMov.id)
    } else {
      await supabase.from('movimientos').insert(data)
    }
    setModalOpen(false)
    setEditMov(null)
    loadMes()
  }

  async function handleDeleteMov(id) {
    if (!window.confirm(t(lang, 'confirm_delete'))) return
    await supabase.from('movimientos').delete().eq('id', id)
    setModalOpen(false)
    setEditMov(null)
    setMovimientos(prev => prev.filter(m => m.id !== id))
  }

  // ── Presupuesto: guardar desde el input inline ──
  async function handleSaveBudget(catId, rawValue) {
    const importe = Math.max(0, parseFloat(rawValue) || 0)
    await supabase
      .from('presupuestos')
      .upsert(
        { hogar_id: hogarId, categoria_id: catId, anio, mes, importe },
        { onConflict: 'hogar_id,categoria_id,anio,mes' }
      )
    setEditBudget(null)
    loadMes()
  }

  // ── Cerrar sesión ──
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // ── Resumen calculado ──
  const totalGastos = movimientos.filter(m => m.tipo === 'gasto').reduce((s, m) => s + Number(m.importe), 0)
  const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.importe), 0)
  const balance = totalIngresos - totalGastos

  const gastoPorCat = {}
  movimientos.filter(m => m.tipo === 'gasto' && m.categoria_id).forEach(m => {
    gastoPorCat[m.categoria_id] = (gastoPorCat[m.categoria_id] ?? 0) + Number(m.importe)
  })
  const presupuestoPorCat = Object.fromEntries(presupuestos.map(p => [p.categoria_id, Number(p.importe)]))

  const gastosCats = categorias.filter(c => c.tipo === 'gasto')

  function catName(id) {
    return categorias.find(c => c.id === id)?.nombre ?? t(lang, 'no_category')
  }
  function subcatName(id) {
    return id ? (subcategorias.find(s => s.id === id)?.nombre ?? '') : ''
  }

  // ── Guardia: perfil no cargado ──
  if (!profile) {
    return <div className="splash">{t('es', 'loading')}</div>
  }

  if (!hogarId) {
    return (
      <div className="splash splash-warn">
        <p>{t(lang, 'profile_missing')}</p>
        <button className="btn-secondary" onClick={handleSignOut}>{t(lang, 'sign_out')}</button>
      </div>
    )
  }

  return (
    <div className="app-root">
      {/* ── Cabecera ── */}
      <header className="app-header">
        <button className="btn-nav" onClick={prevMes} title={t(lang, 'prev_month')}>‹</button>
        <h1 className="header-month">{MONTHS[lang][mes - 1]} {anio}</h1>
        <button className="btn-nav" onClick={nextMes} title={t(lang, 'next_month')} disabled={isCurrentMonth}>›</button>

        <div className="header-actions">
          <button className="campana-btn" onClick={handleOpenActivity} title={t(lang, 'activity_title')}>
            🔔
            {unread > 0 && (
              <span className="campana-badge" aria-label={`${unread} sin leer`}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <button
            className="btn-lang"
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            title={t(lang, 'language')}
          >
            {lang.toUpperCase()}
          </button>
          <button className="btn-icon" onClick={handleSignOut} title={t(lang, 'sign_out')}>⏻</button>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main className="app-content">

        {/* Resumen del mes */}
        <div className="summary-grid">
          <div className="summary-card income-card">
            <span className="summary-label">{t(lang, 'total_income')}</span>
            <span className="summary-value">{fmt(totalIngresos)}</span>
          </div>
          <div className="summary-card expense-card">
            <span className="summary-label">{t(lang, 'total_expenses')}</span>
            <span className="summary-value">{fmt(totalGastos)}</span>
          </div>
          <div className={`summary-card balance-card ${balance >= 0 ? 'balance-pos' : 'balance-neg'}`}>
            <span className="summary-label">{t(lang, 'balance')}</span>
            <span className="summary-value">{balance >= 0 ? '+' : ''}{fmt(balance)}</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-row">{t(lang, 'loading')}</div>
        ) : (
          <>
            {/* Por categoría (gastos) */}
            <section className="section">
              <h2 className="section-title">{t(lang, 'budget_section')}</h2>
              {gastosCats.length === 0
                ? <p className="empty-text">Sin categorías de gasto.</p>
                : gastosCats.map(cat => {
                    const spent = gastoPorCat[cat.id] ?? 0
                    const budget = presupuestoPorCat[cat.id] ?? 0
                    const ratio = budget > 0 ? spent / budget : 0
                    const pct = Math.min(100, ratio * 100)
                    const barClass = ratio > 1 ? 'bar-over' : ratio > 0.8 ? 'bar-warn' : 'bar-ok'
                    return (
                      <div key={cat.id} className="budget-row">
                        <div className="budget-row-top">
                          <span className="budget-cat-name">{cat.nombre}</span>
                          <div className="budget-amounts">
                            <span className="budget-spent">{fmt(spent)}</span>
                            {editBudget?.catId === cat.id ? (
                              <input
                                className="budget-inline-input"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={budget > 0 ? budget : ''}
                                autoFocus
                                placeholder="0"
                                onBlur={e => handleSaveBudget(cat.id, e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveBudget(cat.id, e.target.value)
                                  if (e.key === 'Escape') setEditBudget(null)
                                }}
                              />
                            ) : (
                              <button
                                className="budget-limit-btn"
                                onClick={() => setEditBudget({ catId: cat.id })}
                                title={t(lang, 'set_budget')}
                              >
                                {budget > 0 ? `/ ${fmt(budget)}` : t(lang, 'no_budget')}
                              </button>
                            )}
                          </div>
                        </div>
                        {budget > 0 && (
                          <div className="budget-bar-track">
                            <div className={`budget-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                    )
                  })
              }
            </section>

            {/* Movimientos */}
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">{t(lang, 'movements_section')}</h2>
                <button
                  className="btn-sm btn-primary"
                  onClick={() => { setEditMov(null); setModalOpen(true) }}
                >
                  {t(lang, 'add_movement')}
                </button>
              </div>

              {movimientos.length === 0 ? (
                <p className="empty-text">{t(lang, 'no_movements')}</p>
              ) : (
                <div className="movements-list">
                  {movimientos.map(m => {
                    const sub = subcatName(m.subcategoria_id)
                    return (
                      <button
                        key={m.id}
                        className="movement-item"
                        onClick={() => { setEditMov(m); setModalOpen(true) }}
                      >
                        <div className="movement-left">
                          <span className="movement-date">{m.fecha}</span>
                          <span className="movement-cat">
                            {catName(m.categoria_id)}{sub ? ` · ${sub}` : ''}
                          </span>
                          {m.nota && <span className="movement-nota">{m.nota}</span>}
                        </div>
                        <span className={`movement-amount ${m.tipo === 'gasto' ? 'amount-expense' : 'amount-income'}`}>
                          {m.tipo === 'gasto' ? '-' : '+'}{fmt(Number(m.importe))}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Modal movimiento */}
      <MovimientoModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMov(null) }}
        onSave={handleSaveMov}
        onDelete={handleDeleteMov}
        movimiento={editMov}
        categorias={categorias}
        subcategorias={subcategorias}
        hogarId={hogarId}
        userId={profile?.id}
      />

      {/* Panel de actividad */}
      <ActivityPanel
        open={showActivity}
        onClose={() => setShowActivity(false)}
        actividades={actividades}
        currentUserId={profile?.id}
        usuarios={usuarios}
      />
    </div>
  )
}
