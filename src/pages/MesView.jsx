import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { t, MONTHS } from '../i18n'
import MovimientoModal from '../components/MovimientoModal'
import ActivityPanel from '../components/ActivityPanel'
import GraficasMes from '../components/GraficasMes'

const CAT_PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#84cc16',
]

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

  // Filtro de tipo y búsqueda en lista de movimientos
  const [filtroTipo, setFiltroTipo] = useState('all')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCatId, setFiltroCatId] = useState(null)
  const [sortMovs, setSortMovs] = useState('fecha') // 'fecha' | 'importe'

  const movListRef = useRef(null)
  const touchX = useRef(null)
  const touchY = useRef(null)

  // Edición inline de presupuesto
  const [editBudget, setEditBudget] = useState(null) // { catId }

  // Help overlay (atajos de teclado)
  const [showHelp, setShowHelp] = useState(false)

  // Tendencia mensual (últimos 6 meses, sin etiquetas de idioma)
  const [rawTrend, setRawTrend] = useState([])
  const [prevTotals, setPrevTotals] = useState(null)

  const hogarId = profile?.hogar_id

  const fmt = useMemo(() => {
    const f = new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', {
      style: 'currency',
      currency: 'EUR',
    })
    return (n) => f.format(n)
  }, [lang])

  const catColorMap = useMemo(() =>
    Object.fromEntries(
      categorias
        .filter(c => c.tipo === 'gasto')
        .map((c, i) => [c.id, CAT_PALETTE[i % CAT_PALETTE.length]])
    ),
  [categorias])

  const catMap = useMemo(() => new Map(categorias.map(c => [c.id, c.nombre])), [categorias])
  const subcatMap = useMemo(() => new Map(subcategorias.map(s => [s.id, s.nombre])), [subcategorias])

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

  // Limpiar filtros al cambiar de mes
  useEffect(() => { setBusqueda(''); setFiltroTipo('all'); setFiltroCatId(null); setSortMovs('fecha') }, [anio, mes])

  // Bloquear scroll del body cuando hay un panel/modal abierto (fix iOS)
  useEffect(() => {
    const locked = modalOpen || showActivity || showHelp
    document.body.style.overflow = locked ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen, showActivity, showHelp])

  // ── Tendencia: últimos 6 meses ──
  const loadTrend = useCallback(async () => {
    if (!hogarId) return
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anio, mes - 1 - i, 1)
      months.push({ anio: d.getFullYear(), mes: d.getMonth() + 1 })
    }
    const first = months[0]
    const startStr = `${first.anio}-${String(first.mes).padStart(2, '0')}-01`
    const lastDay = new Date(anio, mes, 0).getDate()
    const endStr = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data } = await supabase
      .from('movimientos')
      .select('tipo, importe, anio, mes')
      .eq('hogar_id', hogarId)
      .gte('fecha', startStr)
      .lte('fecha', endStr)

    if (!data) return
    const agg = {}
    months.forEach(m => { agg[`${m.anio}-${m.mes}`] = { anio: m.anio, mes: m.mes, income: 0, expenses: 0 } })
    data.forEach(mov => {
      const key = `${mov.anio}-${mov.mes}`
      if (agg[key]) {
        if (mov.tipo === 'ingreso') agg[key].income += Number(mov.importe)
        else agg[key].expenses += Number(mov.importe)
      }
    })
    setRawTrend(months.map(m => agg[`${m.anio}-${m.mes}`]))
  }, [hogarId, anio, mes])

  useEffect(() => { loadTrend() }, [loadTrend])

  // ── Totales mes anterior (para deltas en resumen) ──
  const loadPrevMes = useCallback(async () => {
    if (!hogarId) return
    const d = new Date(anio, mes - 2, 1)
    const { data } = await supabase
      .from('movimientos')
      .select('tipo, importe')
      .eq('hogar_id', hogarId)
      .eq('anio', d.getFullYear())
      .eq('mes', d.getMonth() + 1)
    if (!data) return
    setPrevTotals(
      data.reduce(
        (acc, m) => {
          if (m.tipo === 'ingreso') acc.ingresos += Number(m.importe)
          else acc.gastos += Number(m.importe)
          return acc
        },
        { ingresos: 0, gastos: 0 }
      )
    )
  }, [hogarId, anio, mes])

  useEffect(() => { loadPrevMes() }, [loadPrevMes])

  const trendData = useMemo(() =>
    rawTrend.map(d => ({
      ...d,
      label: MONTHS[lang][d.mes - 1].slice(0, 3),
    })),
  [rawTrend, lang])

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
  const prevMes = useCallback(() => {
    if (mes === 1) { setAnio(a => a - 1); setMes(12) }
    else setMes(m => m - 1)
  }, [mes])

  const nextMes = useCallback(() => {
    if (mes === 12) { setAnio(a => a + 1); setMes(1) }
    else setMes(m => m + 1)
  }, [mes])

  const isCurrentMonth = anio === todayDate.getFullYear() && mes === todayDate.getMonth() + 1

  // Teclado: ← → navegar meses, n → añadir movimiento
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && showHelp) { setShowHelp(false); return }
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (modalOpen || showActivity || showHelp) return
      if (e.key === 'ArrowLeft') prevMes()
      if (e.key === 'ArrowRight' && !isCurrentMonth) nextMes()
      if (e.key === 'n' || e.key === 'N') { setEditMov(null); setModalOpen(true) }
      if ((e.key === 't' || e.key === 'T') && !isCurrentMonth) { setAnio(todayDate.getFullYear()); setMes(todayDate.getMonth() + 1) }
      if (e.key === '?') setShowHelp(h => !h)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, showActivity, showHelp, isCurrentMonth, prevMes, nextMes])

  // ── Swipe horizontal → cambiar mes ──
  function handleTouchStart(e) {
    touchX.current = e.touches[0].clientX
    touchY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e) {
    if (touchX.current === null || modalOpen || showActivity) return
    const dx = e.changedTouches[0].clientX - touchX.current
    const dy = e.changedTouches[0].clientY - touchY.current
    touchX.current = null
    if (Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 2) {
      if (dx > 0) prevMes()
      else if (!isCurrentMonth) nextMes()
    }
  }

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

  // ── Presupuesto: copiar del mes anterior ──
  async function handleCopyBudgetFromLastMonth() {
    const d = new Date(anio, mes - 2, 1)
    const { data } = await supabase
      .from('presupuestos')
      .select('categoria_id, importe')
      .eq('hogar_id', hogarId)
      .eq('anio', d.getFullYear())
      .eq('mes', d.getMonth() + 1)
    if (!data || data.length === 0) return
    await supabase
      .from('presupuestos')
      .upsert(
        data.map(p => ({ hogar_id: hogarId, categoria_id: p.categoria_id, anio, mes, importe: p.importe })),
        { onConflict: 'hogar_id,categoria_id,anio,mes' }
      )
    loadMes()
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

  // ── Exportar CSV del mes ──
  function exportarCSV() {
    const header = ['fecha', 'tipo', 'importe', 'categoria', 'subcategoria', 'nota'].join(',')
    const rows = movimientos.map(m => [
      m.fecha,
      m.tipo,
      Number(m.importe).toFixed(2),
      `"${catName(m.categoria_id).replace(/"/g, '""')}"`,
      `"${subcatName(m.subcategoria_id).replace(/"/g, '""')}"`,
      `"${(m.nota || '').replace(/"/g, '""')}"`,
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finanzas-${anio}-${String(mes).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Cerrar sesión ──
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // ── Resumen calculado ──
  const gastosItems = movimientos.filter(m => m.tipo === 'gasto')
  const ingresosItems = movimientos.filter(m => m.tipo === 'ingreso')
  const totalGastos = gastosItems.reduce((s, m) => s + Number(m.importe), 0)
  const totalIngresos = ingresosItems.reduce((s, m) => s + Number(m.importe), 0)
  const balance = totalIngresos - totalGastos

  const deltaIngresos = prevTotals?.ingresos > 0 ? (totalIngresos - prevTotals.ingresos) / prevTotals.ingresos * 100 : null
  const deltaGastos   = prevTotals?.gastos   > 0 ? (totalGastos   - prevTotals.gastos)   / prevTotals.gastos   * 100 : null

  const movimientosFiltrados = useMemo(() => {
    let list = movimientos
      .filter(m => filtroTipo === 'all' || m.tipo === filtroTipo)
      .filter(m => !filtroCatId || m.categoria_id === filtroCatId)
      .filter(m => {
        if (!busqueda) return true
        const q = busqueda.toLowerCase()
        return (
          (catMap.get(m.categoria_id) ?? '').toLowerCase().includes(q) ||
          (subcatMap.get(m.subcategoria_id) ?? '').toLowerCase().includes(q) ||
          (m.nota || '').toLowerCase().includes(q)
        )
      })
    if (sortMovs === 'importe') {
      list = [...list].sort((a, b) => Number(b.importe) - Number(a.importe))
    }
    return list
  }, [movimientos, filtroTipo, filtroCatId, busqueda, sortMovs, catMap, subcatMap])

  const totalFiltrado = useMemo(
    () => movimientosFiltrados.reduce((s, m) => s + Number(m.importe), 0),
    [movimientosFiltrados]
  )
  const hayFiltroActivo = filtroTipo !== 'all' || busqueda || filtroCatId

  // Agrupar por fecha cuando el orden es temporal; lista plana cuando es por importe
  const renderList = useMemo(() => {
    if (sortMovs === 'importe') {
      return movimientosFiltrados.map(m => ({ type: 'item', m }))
    }
    const result = []
    let currentDate = null
    for (const m of movimientosFiltrados) {
      if (m.fecha !== currentDate) {
        currentDate = m.fecha
        result.push({ type: 'header', date: m.fecha })
      }
      result.push({ type: 'item', m })
    }
    return result
  }, [movimientosFiltrados, sortMovs])

  const gastoPorCat = {}
  const movCountByCat = {}
  movimientos.filter(m => m.tipo === 'gasto' && m.categoria_id).forEach(m => {
    gastoPorCat[m.categoria_id] = (gastoPorCat[m.categoria_id] ?? 0) + Number(m.importe)
    movCountByCat[m.categoria_id] = (movCountByCat[m.categoria_id] ?? 0) + 1
  })
  const presupuestoPorCat = Object.fromEntries(presupuestos.map(p => [p.categoria_id, Number(p.importe)]))

  const gastosCats = categorias
    .filter(c => c.tipo === 'gasto')
    .sort((a, b) => {
      const ra = presupuestoPorCat[a.id] > 0 ? (gastoPorCat[a.id] ?? 0) / presupuestoPorCat[a.id] : -1
      const rb = presupuestoPorCat[b.id] > 0 ? (gastoPorCat[b.id] ?? 0) / presupuestoPorCat[b.id] : -1
      if (ra >= 1 && rb < 1) return -1  // over-budget first
      if (rb >= 1 && ra < 1) return 1
      const spentA = gastoPorCat[a.id] ?? 0
      const spentB = gastoPorCat[b.id] ?? 0
      return rb - ra || spentB - spentA  // then by % used desc, then by amount desc
    })

  const totalPresupuestado = Object.values(presupuestoPorCat).reduce((s, v) => s + v, 0)
  const totalGastadoConPresupuesto = gastosCats
    .filter(c => presupuestoPorCat[c.id] > 0)
    .reduce((s, c) => s + (gastoPorCat[c.id] ?? 0), 0)

  function catName(id) { return catMap.get(id) ?? t(lang, 'no_category') }
  function subcatName(id) { return id ? (subcatMap.get(id) ?? '') : '' }
  function formatFecha(dateStr) {
    const todayStr = todayDate.toISOString().slice(0, 10)
    const yesterdayStr = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 1).toISOString().slice(0, 10)
    if (dateStr === todayStr) return t(lang, 'today')
    if (dateStr === yesterdayStr) return t(lang, 'yesterday')
    const parts = dateStr.split('-')
    const day = parseInt(parts[2])
    const monthAbbr = MONTHS[lang][parseInt(parts[1]) - 1].slice(0, 3)
    return lang === 'es'
      ? `${day} ${monthAbbr.toLowerCase()}`
      : `${monthAbbr} ${day}`
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
    <div className="app-root" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* ── Cabecera ── */}
      <header className="app-header">
        <button className="btn-nav" onClick={prevMes} title={t(lang, 'prev_month')}>‹</button>
        <h1 className="header-month">{MONTHS[lang][mes - 1]} {anio}</h1>
        <button className="btn-nav" onClick={nextMes} title={t(lang, 'next_month')} disabled={isCurrentMonth}>›</button>

        {!isCurrentMonth && (
          <button
            className="back-today-btn"
            onClick={() => { setAnio(todayDate.getFullYear()); setMes(todayDate.getMonth() + 1) }}
          >
            {t(lang, 'today')}
          </button>
        )}

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
      <main className={`app-content${loading ? ' app-loading' : ''}`}>

        {/* Resumen del mes */}
        <div className="summary-grid">
          <div className="summary-card income-card" aria-label={`${t(lang, 'total_income')}: ${fmt(totalIngresos)}`}>
            <span className="summary-label">{t(lang, 'total_income')}</span>
            <span className="summary-value">{fmt(totalIngresos)}</span>
            {deltaIngresos !== null && (
              <span className={`summary-delta ${deltaIngresos >= 0 ? 'delta-pos' : 'delta-muted'}`}>
                {deltaIngresos >= 0 ? '▲' : '▼'} {Math.abs(deltaIngresos).toFixed(0)}%
              </span>
            )}
            {ingresosItems.length > 0 && (
              <span className="summary-count">{ingresosItems.length}</span>
            )}
          </div>
          <div className="summary-card expense-card" aria-label={`${t(lang, 'total_expenses')}: ${fmt(totalGastos)}`}>
            <span className="summary-label">{t(lang, 'total_expenses')}</span>
            <span className="summary-value">{fmt(totalGastos)}</span>
            {deltaGastos !== null && (
              <span className={`summary-delta ${deltaGastos >= 0 ? 'delta-neg' : 'delta-pos'}`}>
                {deltaGastos >= 0 ? '▲' : '▼'} {Math.abs(deltaGastos).toFixed(0)}%
              </span>
            )}
            {gastosItems.length > 0 && (
              <span className="summary-count">{gastosItems.length}</span>
            )}
          </div>
          <div className={`summary-card balance-card ${balance >= 0 ? 'balance-pos' : 'balance-neg'}`} aria-label={`${t(lang, 'balance')}: ${fmt(balance)}`}>
            <span className="summary-label">{t(lang, 'balance')}</span>
            <span className="summary-value">{balance >= 0 ? '+' : ''}{fmt(balance)}</span>
            {totalIngresos > 0 && (
              <span className={`summary-savings ${balance >= 0 ? 'delta-pos' : 'delta-neg'}`}>
                {balance >= 0
                  ? `${Math.round(balance / totalIngresos * 100)}% ${t(lang, 'saved')}`
                  : t(lang, 'overspent')}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="skeleton-wrap" aria-hidden="true">
            <div className="skeleton-section">
              <div className="skeleton skeleton-title" />
              {[1,2,3,4].map(i => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton skeleton-dot" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-val" />
                </div>
              ))}
            </div>
            <div className="skeleton-section">
              <div className="skeleton skeleton-title" />
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton skeleton-dot" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-val" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Gráficas */}
            <GraficasMes
              lang={lang}
              gastoPorCat={gastoPorCat}
              categorias={categorias}
              trendData={trendData}
              fmt={fmt}
              catColors={catColorMap}
              onSelectCat={catId => {
                setFiltroCatId(catId)
                setFiltroTipo(catId ? 'gasto' : 'all')
                if (catId) movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            />

            {/* Por categoría (gastos) */}
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">{t(lang, 'budget_section')}</h2>
                {presupuestos.length === 0 && (
                  <button className="btn-sm btn-secondary" onClick={handleCopyBudgetFromLastMonth}>
                    {t(lang, 'copy_budget_prev')}
                  </button>
                )}
              </div>

              {totalPresupuestado > 0 && (() => {
                const daysInMonth = new Date(anio, mes, 0).getDate()
                const daysElapsed = isCurrentMonth
                  ? Math.max(1, todayDate.getDate())
                  : daysInMonth
                const timePct = daysElapsed / daysInMonth
                const spendPct = totalGastadoConPresupuesto / totalPresupuestado
                const paceRatio = timePct > 0 ? spendPct / timePct : 1
                const paceLabel = paceRatio > 1.15
                  ? (lang === 'es' ? '↑ acelerado' : '↑ fast')
                  : paceRatio < 0.75
                    ? (lang === 'es' ? '↓ controlado' : '↓ under')
                    : (lang === 'es' ? '→ en ritmo' : '→ on track')
                const paceCls = paceRatio > 1.15 ? 'pace-fast' : paceRatio < 0.75 ? 'pace-slow' : 'pace-ok'
                return (
                  <div className="budget-overview">
                    <div className="budget-overview-row">
                      <span className="budget-overview-label">{t(lang, 'budget_total')}</span>
                      <span className="budget-overview-amounts">
                        <span className="budget-spent">{fmt(totalGastadoConPresupuesto)}</span>
                        <span className="budget-overview-total">/ {fmt(totalPresupuestado)}</span>
                      </span>
                    </div>
                    <div className="budget-bar-track" style={{ position: 'relative' }}>
                      <div
                        className={`budget-bar-fill ${
                          totalGastadoConPresupuesto > totalPresupuestado ? 'bar-over'
                          : totalGastadoConPresupuesto / totalPresupuestado > 0.8 ? 'bar-warn'
                          : 'bar-ok'
                        }`}
                        style={{ width: `${Math.min(100, spendPct * 100)}%` }}
                      />
                      {isCurrentMonth && (
                        <div
                          className="budget-time-marker"
                          style={{ left: `${Math.min(100, timePct * 100)}%` }}
                        />
                      )}
                    </div>
                    {isCurrentMonth && (
                      <div className="budget-pace-row">
                        <span className="budget-pace-day">
                          {lang === 'es'
                            ? `Día ${todayDate.getDate()} de ${daysInMonth}`
                            : `Day ${todayDate.getDate()} of ${daysInMonth}`}
                        </span>
                        <span className={`budget-pace-label ${paceCls}`}>{paceLabel}</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {gastosCats.length === 0
                ? <p className="empty-text">{t(lang, 'no_expense_cats')}</p>
                : gastosCats.map(cat => {
                    const spent = gastoPorCat[cat.id] ?? 0
                    const budget = presupuestoPorCat[cat.id] ?? 0
                    const ratio = budget > 0 ? spent / budget : 0
                    const pct = Math.min(100, ratio * 100)
                    const barClass = ratio > 1 ? 'bar-over' : ratio > 0.8 ? 'bar-warn' : 'bar-ok'
                    const fmtC = n => n >= 1000 ? `${(n/1000).toFixed(1)}k€` : `${Math.round(n)}€`
                    const pctLabel = ratio > 1
                      ? `+${fmtC(spent - budget)}`
                      : ratio > 0.8
                        ? fmtC(budget - spent)
                        : `${Math.round(pct)}%`
                    const pctCls = barClass === 'bar-over' ? 'pct-over' : barClass === 'bar-warn' ? 'pct-warn' : 'pct-ok'
                    return (
                      <div key={cat.id} className={`budget-row${filtroCatId === cat.id ? ' budget-row-active' : ''}${spent === 0 ? ' budget-row-zero' : ''}`}>
                        <div className="budget-row-top">
                          <button
                            className="budget-cat-name budget-cat-btn"
                            onClick={() => {
                              const next = filtroCatId === cat.id ? null : cat.id
                              setFiltroCatId(next)
                              if (next) movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }}
                          >
                            <span
                              className="budget-cat-dot"
                              style={{ background: catColorMap[cat.id] ?? '#94a3b8' }}
                            />
                            {cat.nombre}
                            {(movCountByCat[cat.id] ?? 0) > 0 && (
                              <span className="budget-cat-count">{movCountByCat[cat.id]}</span>
                            )}
                          </button>
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
                                onFocus={e => e.target.select()}
                                onBlur={e => handleSaveBudget(cat.id, e.target.value.replace(',', '.'))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveBudget(cat.id, e.target.value.replace(',', '.'))
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
                          <div className="budget-bar-wrap">
                            <div className="budget-bar-track">
                              <div className={`budget-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`budget-bar-pct ${pctCls}`} title={`${Math.round(ratio * 100)}%`}>
                              {pctLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
              }
            </section>

            {/* Movimientos */}
            <section className="section" ref={movListRef}>
              <div className="section-header">
                <h2 className="section-title">{t(lang, 'movements_section')}</h2>
                <div className="section-header-actions">
                  {movimientos.length > 0 && (
                    <button className="btn-sm btn-secondary" onClick={exportarCSV}>
                      {t(lang, 'export_csv')}
                    </button>
                  )}
                  <button
                    className="btn-sm btn-primary"
                    onClick={() => { setEditMov(null); setModalOpen(true) }}
                  >
                    {t(lang, 'add_movement')}
                  </button>
                </div>
              </div>

              {movimientos.length > 0 && (
                <>
                  <div className="filter-tabs-row">
                    <div className="filter-tabs">
                      {['all', 'gasto', 'ingreso'].map(tipo => {
                        const count = tipo === 'all' ? movimientos.length : movimientos.filter(m => m.tipo === tipo).length
                        return (
                          <button
                            key={tipo}
                            className={`filter-tab${filtroTipo === tipo ? ' filter-tab-active' : ''}`}
                            onClick={() => setFiltroTipo(tipo)}
                          >
                            {tipo === 'all' ? t(lang, 'filter_all') : tipo === 'gasto' ? t(lang, 'expense') : t(lang, 'income')}
                            {count > 0 && <span className="tab-count">{count}</span>}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      className={`sort-btn${sortMovs === 'importe' ? ' sort-btn-active' : ''}`}
                      onClick={() => setSortMovs(s => s === 'fecha' ? 'importe' : 'fecha')}
                      title={lang === 'es'
                        ? (sortMovs === 'fecha' ? 'Ordenar por importe' : 'Ordenar por fecha')
                        : (sortMovs === 'fecha' ? 'Sort by amount' : 'Sort by date')}
                    >
                      {sortMovs === 'fecha'
                        ? t(lang, 'date').slice(0, 4) + ' ↓'
                        : '€ ↓'}
                    </button>
                  </div>
                  <div className="search-wrap">
                    <input
                      className="search-input"
                      type="search"
                      placeholder={lang === 'es' ? 'Buscar categoría, nota…' : 'Search category, note…'}
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                      <button className="search-clear" onClick={() => setBusqueda('')}>×</button>
                    )}
                  </div>
                  {filtroCatId && (
                    <div className="cat-filter-chip">
                      <span>{catName(filtroCatId)}</span>
                      <button className="search-clear" onClick={() => setFiltroCatId(null)}>×</button>
                    </div>
                  )}
                  {hayFiltroActivo && movimientosFiltrados.length > 0 && (
                    <p className="filter-summary">
                      {movimientosFiltrados.length} · {fmt(totalFiltrado)}
                    </p>
                  )}
                </>
              )}

              {movimientosFiltrados.length === 0 ? (
                <div className="empty-filtered">
                  <p className="empty-text">
                    {hayFiltroActivo ? t(lang, 'no_results') : t(lang, 'no_movements')}
                  </p>
                  {hayFiltroActivo ? (
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => { setFiltroTipo('all'); setBusqueda(''); setFiltroCatId(null) }}
                    >
                      {t(lang, 'clear_filters')}
                    </button>
                  ) : (
                    <button
                      className="btn-sm btn-primary"
                      onClick={() => { setEditMov(null); setModalOpen(true) }}
                    >
                      {t(lang, 'add_movement')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="movements-list">
                  {renderList.map((entry, idx) => {
                    if (entry.type === 'header') {
                      return (
                        <div key={`h-${entry.date}`} className="movement-date-header">
                          {formatFecha(entry.date)}
                        </div>
                      )
                    }
                    const m = entry.m
                    const sub = subcatName(m.subcategoria_id)
                    return (
                      <button
                        key={m.id}
                        className="movement-item"
                        onClick={() => { setEditMov(m); setModalOpen(true) }}
                      >
                        <div className="movement-left">
                          {(sortMovs === 'importe' || usuarios.length > 1) && (
                            <div className="movement-meta">
                              {sortMovs === 'importe' && (
                                <span className="movement-date" title={m.fecha}>{formatFecha(m.fecha)}</span>
                              )}
                              {usuarios.length > 1 && m.creado_por && (
                                <span className="movement-creator">
                                  {m.creado_por === profile?.id
                                    ? t(lang, 'you')
                                    : (usuarios.find(u => u.id === m.creado_por)?.nombre ?? '')}
                                </span>
                              )}
                            </div>
                          )}
                          <span className="movement-cat">
                            {m.categoria_id && catColorMap[m.categoria_id] && (
                              <span
                                className="movement-cat-dot"
                                style={{ background: catColorMap[m.categoria_id] }}
                              />
                            )}
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
        defaultTipo={filtroTipo !== 'all' ? filtroTipo : 'gasto'}
        defaultCatId={!editMov && filtroTipo !== 'ingreso' ? filtroCatId : null}
      />

      {/* Panel de actividad */}
      <ActivityPanel
        open={showActivity}
        onClose={() => setShowActivity(false)}
        actividades={actividades}
        currentUserId={profile?.id}
        usuarios={usuarios}
        lastViewedAt={profile?.actividad_vista_en}
      />

      {/* Help overlay: atajos de teclado */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-card help-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{lang === 'es' ? 'Atajos de teclado' : 'Keyboard shortcuts'}</h2>
              <button className="btn-icon" onClick={() => setShowHelp(false)} aria-label="Cerrar">✕</button>
            </div>
            <table className="help-table">
              <tbody>
                {[
                  ['←  →', lang === 'es' ? 'Mes anterior / siguiente' : 'Previous / next month'],
                  ['N', lang === 'es' ? 'Nuevo movimiento' : 'New movement'],
                  ['T', lang === 'es' ? 'Ir al mes actual' : 'Go to current month'],
                  ['?', lang === 'es' ? 'Mostrar / ocultar atajos' : 'Show / hide shortcuts'],
                  ['Esc', lang === 'es' ? 'Cerrar modal' : 'Close modal'],
                ].map(([key, desc]) => (
                  <tr key={key}>
                    <td className="help-key"><kbd>{key}</kbd></td>
                    <td className="help-desc">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAB añadir movimiento */}
      {!modalOpen && !showActivity && (
        <button
          className="fab"
          onClick={() => { setEditMov(null); setModalOpen(true) }}
          title={t(lang, 'new_movement')}
          aria-label={t(lang, 'new_movement')}
        >
          +
        </button>
      )}
    </div>
  )
}
