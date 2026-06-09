import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { t, tFmt, MONTHS } from '../i18n'
import MovimientoModal from '../components/MovimientoModal'
import ActivityPanel from '../components/ActivityPanel'
import GraficasMes from '../components/GraficasMes'
import CategoriasModal from '../components/CategoriasModal'
import ImportarCSVModal from '../components/ImportarCSVModal'
import PlantillasModal from '../components/PlantillasModal'

const CAT_PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#84cc16',
]
// Colors from DB take priority; palette is the fallback

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
  const [filtroFijo, setFiltroFijo] = useState(null) // null=all, true=fixed, false=variable
  const [filtroPendiente, setFiltroPendiente] = useState(false) // true=only pending
  const [busqueda, setBusqueda] = useState('')
  const [filtroCatId, setFiltroCatId] = useState(null)
  const [sortMovs, setSortMovs] = useState(() => localStorage.getItem('sortMovs') ?? 'fecha')
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compactMode') === '1')

  const movListRef = useRef(null)
  const searchRef = useRef(null)
  const monthPickerRef = useRef(null)
  const touchX = useRef(null)
  const touchY = useRef(null)

  // Edición inline de presupuesto
  const [editBudget, setEditBudget] = useState(null) // { catId }

  // Categoría pre-seleccionada al abrir modal desde una fila de presupuesto
  const [quickAddCatId, setQuickAddCatId] = useState(null)

  // Help overlay (atajos de teclado)
  const [showHelp, setShowHelp] = useState(false)

  // Category management modal
  const [showCatsModal, setShowCatsModal] = useState(false)

  // Recurring templates modal
  const [showPlantillasModal, setShowPlantillasModal] = useState(false)

  // Plantillas fijas (for "load templates" button)
  const [plantillas, setPlantillas] = useState([])

  // Budget section: hide zero-spend no-budget categories
  const [hideZeroCats, setHideZeroCats] = useState(false)

  // Budget subcategory expansion
  const [expandedBudgetCats, setExpandedBudgetCats] = useState(new Set())
  function toggleBudgetCat(catId) {
    setExpandedBudgetCats(prev => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  // CSV import modal
  const [showImportModal, setShowImportModal] = useState(false)

  // Toast notifications (supports undo action)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  function showToast(msg, type = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }
  function showUndoToast(msg, onUndo) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type: 'success', onUndo })
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // Undo delete (Map allows concurrent pending deletes)
  const pendingDeleteIds = useRef(new Set())
  const pendingDeleteTimers = useRef(new Map())
  useEffect(() => () => { pendingDeleteTimers.current.forEach(clearTimeout) }, [])

  // Conceptos recientes del hogar (para datalist + chips del modal)
  const [recentConceptos, setRecentConceptos] = useState([])

  // Duplicate movement
  const [duplicateData, setDuplicateData] = useState(null)
  const [modalKey, setModalKey] = useState(0)

  // Year summary (lazy loaded when toggled)
  const [showYearView, setShowYearView] = useState(false)
  const [yearData, setYearData] = useState(null)
  const [yearLoading, setYearLoading] = useState(false)

  // Welcome banner (shown once on empty current month)
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => !!localStorage.getItem('welcomeDismissed'))
  function dismissWelcome() { localStorage.setItem('welcomeDismissed', '1'); setWelcomeDismissed(true) }

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  useEffect(() => {
    if (localStorage.getItem('install_dismissed')) return
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    installPrompt.userChoice.then(() => {
      setInstallPrompt(null)
      setShowInstallBanner(false)
    })
  }
  function dismissInstall() {
    localStorage.setItem('install_dismissed', '1')
    setShowInstallBanner(false)
  }

  // Dark mode manual override (D key cycles system/dark/light)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'auto')
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.setAttribute('data-theme', 'dark')
    else if (theme === 'light') root.setAttribute('data-theme', 'light')
    else root.removeAttribute('data-theme')
    theme !== 'auto' ? localStorage.setItem('theme', theme) : localStorage.removeItem('theme')
  }, [theme])
  function cycleTheme() { setTheme(prev => prev === 'auto' ? 'dark' : prev === 'dark' ? 'light' : 'auto') }

  // Tendencia mensual (últimos 6 meses, sin etiquetas de idioma)
  const [rawTrend, setRawTrend] = useState([])
  const [prevTotals, setPrevTotals] = useState(null)

  const hogarId = profile?.hogar_id

  // Monthly savings goal (per-device, per-household)
  const [savingsGoal, setSavingsGoal] = useState(null)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  useEffect(() => {
    if (!hogarId) return
    const stored = localStorage.getItem(`savings_goal_${hogarId}`)
    setSavingsGoal(stored ? parseFloat(stored) : null)
  }, [hogarId])
  function saveGoal(val) {
    const n = parseFloat(String(val).replace(',', '.'))
    if (!isNaN(n) && n > 0) {
      localStorage.setItem(`savings_goal_${hogarId}`, String(n))
      setSavingsGoal(n)
    } else {
      localStorage.removeItem(`savings_goal_${hogarId}`)
      setSavingsGoal(null)
    }
    setEditingGoal(false)
  }

  // Month notes (per device, per household, per month)
  const monthNoteKey = hogarId ? `month_note_${hogarId}_${anio}_${mes}` : null
  const [monthNote, setMonthNote] = useState('')
  const [editingNote, setEditingNote] = useState(false)
  useEffect(() => {
    if (!monthNoteKey) return
    setMonthNote(localStorage.getItem(monthNoteKey) ?? '')
    setEditingNote(false)
  }, [monthNoteKey])
  function saveMonthNote(val) {
    const v = val.trim()
    if (v) localStorage.setItem(monthNoteKey, v)
    else localStorage.removeItem(monthNoteKey)
    setMonthNote(v)
    setEditingNote(false)
  }

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
        .map((c, i) => [c.id, c.color || CAT_PALETTE[i % CAT_PALETTE.length]])
    ),
  [categorias])

  const catMap = useMemo(() => new Map(categorias.map(c => [c.id, c.nombre])), [categorias])
  const subcatMap = useMemo(() => new Map(subcategorias.map(s => [s.id, s.nombre])), [subcategorias])

  // ── Carga de datos estáticos (categorías, subcategorías, perfiles del hogar) ──
  const loadStaticos = useCallback(() => {
    if (!hogarId) return
    const since60d = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)
    Promise.all([
      supabase.from('categorias').select('*').eq('hogar_id', hogarId).eq('archivada', false).order('tipo').order('orden'),
      supabase.from('subcategorias').select('*').eq('hogar_id', hogarId).eq('archivada', false).order('orden'),
      supabase.from('usuarios').select('id, nombre').eq('hogar_id', hogarId),
      supabase.from('movimientos').select('concepto, categoria_id').eq('hogar_id', hogarId).not('concepto', 'is', null).gte('fecha', since60d).limit(200),
      supabase.from('plantillas_fijas').select('*').eq('hogar_id', hogarId).order('orden').order('creado_en'),
    ]).then(([cats, subcats, usrs, recentC, plantillasRes]) => {
      if (cats.data) setCategorias(cats.data)
      if (subcats.data) setSubcategorias(subcats.data)
      if (usrs.data) setUsuarios(usrs.data)
      if (recentC.data) setRecentConceptos(recentC.data)
      if (plantillasRes.data) setPlantillas(plantillasRes.data)
    })
  }, [hogarId])
  useEffect(() => { loadStaticos() }, [loadStaticos])

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
      if (movRes.data) setMovimientos(movRes.data.filter(m => !pendingDeleteIds.current.has(m.id)))
      if (preRes.data) setPresupuestos(preRes.data)
    } finally {
      setLoading(false)
    }
  }, [hogarId, anio, mes])

  useEffect(() => { loadMes() }, [loadMes])

  // Limpiar filtros al cambiar de mes
  useEffect(() => { setBusqueda(''); setFiltroTipo('all'); setFiltroCatId(null); setFiltroFijo(null); setFiltroPendiente(false) }, [anio, mes])

  // Bloquear scroll del body cuando hay un panel/modal abierto (fix iOS)
  useEffect(() => {
    const locked = modalOpen || showActivity || showHelp || showCatsModal || showImportModal || showPlantillasModal
    document.body.style.overflow = locked ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen, showActivity, showHelp, showCatsModal, showImportModal, showPlantillasModal])

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

  // ── Totales mes anterior (para deltas y rollover) ──
  const loadPrevMes = useCallback(async () => {
    if (!hogarId) return
    const d = new Date(anio, mes - 2, 1)
    const { data } = await supabase
      .from('movimientos')
      .select('tipo, importe, categoria_id')
      .eq('hogar_id', hogarId)
      .eq('anio', d.getFullYear())
      .eq('mes', d.getMonth() + 1)
    if (!data) return
    const result = data.reduce(
      (acc, m) => {
        if (m.tipo === 'ingreso') acc.ingresos += Number(m.importe)
        else {
          acc.gastos += Number(m.importe)
          if (m.categoria_id) acc.gastoPorCat[m.categoria_id] = (acc.gastoPorCat[m.categoria_id] ?? 0) + Number(m.importe)
        }
        return acc
      },
      { ingresos: 0, gastos: 0, gastoPorCat: {} }
    )
    setPrevTotals(result)
  }, [hogarId, anio, mes])

  useEffect(() => { loadPrevMes() }, [loadPrevMes])

  // ── Resumen anual (lazy) ──
  const loadYearData = useCallback(async () => {
    if (!hogarId) return
    setYearLoading(true)
    try {
      const { data } = await supabase
        .from('movimientos')
        .select('tipo, importe, mes')
        .eq('hogar_id', hogarId)
        .eq('anio', anio)
      if (!data) return
      const byMonth = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, income: 0, expenses: 0 }))
      data.forEach(m => {
        const idx = m.mes - 1
        if (byMonth[idx]) {
          if (m.tipo === 'ingreso') byMonth[idx].income += Number(m.importe)
          else byMonth[idx].expenses += Number(m.importe)
        }
      })
      setYearData(byMonth)
    } finally {
      setYearLoading(false)
    }
  }, [hogarId, anio])

  useEffect(() => { if (showYearView) loadYearData() }, [showYearView, loadYearData])

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
  const realtimeDebounce = useRef(null)

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
        () => {
          if (realtimeDebounce.current) clearTimeout(realtimeDebounce.current)
          realtimeDebounce.current = setTimeout(() => loadMesRef.current?.(), 400)
        }
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
  const isFutureMonth = anio > todayDate.getFullYear() || (anio === todayDate.getFullYear() && mes > todayDate.getMonth() + 1)

  // Teclado: ← → navegar meses, n → añadir movimiento
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && showHelp) { setShowHelp(false); return }
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (modalOpen || showActivity || showHelp) return
      if (e.key === 'ArrowLeft') prevMes()
      if (e.key === 'ArrowRight') nextMes()
      if (e.key === 'n' || e.key === 'N') { setEditMov(null); setModalOpen(true) }
      if (e.key === 'i' || e.key === 'I') setShowImportModal(true)
      if (e.key === 't' || e.key === 'T') { setAnio(todayDate.getFullYear()); setMes(todayDate.getMonth() + 1) }
      if (e.key === 'c' || e.key === 'C') setShowCatsModal(true)
      if (e.key === 'r' || e.key === 'R') setShowPlantillasModal(true)
      if (e.key === '?') setShowHelp(h => !h)
      if (e.key === '/' && searchRef.current) { e.preventDefault(); searchRef.current.focus() }
      if (e.key === 'd' || e.key === 'D') cycleTheme()
      if (e.key === 'e' || e.key === 'E') exportarCSV()
      if (e.key === 'y' || e.key === 'Y') setShowYearView(v => !v)
      if (e.key === 'g' || e.key === 'G') document.querySelector('.section-charts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (e.key === 'p' || e.key === 'P') { setFiltroPendiente(v => !v); setFiltroTipo(t => t === 'all' ? 'gasto' : t) }
      if (e.key === 'f' || e.key === 'F') { setFiltroFijo(v => v === true ? null : true) }
      if (e.key === 'x' || e.key === 'X') { setFiltroTipo('all'); setBusqueda(''); setFiltroCatId(null); setFiltroFijo(null); setFiltroPendiente(false) }
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
      else nextMes()
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
    try {
      if (editMov?.id) {
        const { hogar_id, creado_por, ...fields } = data
        const { error } = await supabase.from('movimientos').update(fields).eq('id', editMov.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('movimientos').insert(data)
        if (error) throw error
      }
      setModalOpen(false)
      setEditMov(null)
      showToast(t(lang, 'saved_ok'))
      loadMes()
    } catch {
      showToast(t(lang, 'save_error'), 'error')
    }
  }

  function handleDeleteMov(id) {
    const mov = movimientos.find(m => m.id === id)
    if (!mov) return
    setModalOpen(false)
    setEditMov(null)
    pendingDeleteIds.current.add(id)
    setMovimientos(prev => prev.filter(m => m.id !== id))
    showUndoToast(t(lang, 'deleted_ok'), () => {
      const t2 = pendingDeleteTimers.current.get(id)
      if (t2) { clearTimeout(t2); pendingDeleteTimers.current.delete(id) }
      pendingDeleteIds.current.delete(id)
      setMovimientos(prev =>
        [...prev, mov].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado_en.localeCompare(a.creado_en))
      )
      showToast(t(lang, 'restored_ok'))
    })
    const timer = setTimeout(async () => {
      pendingDeleteTimers.current.delete(id)
      try {
        const { error } = await supabase.from('movimientos').delete().eq('id', id)
        if (error) throw error
      } catch {
        pendingDeleteIds.current.delete(id)
        setMovimientos(prev =>
          [...prev, mov].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado_en.localeCompare(a.creado_en))
        )
        showToast(t(lang, 'save_error'), 'error')
      } finally {
        pendingDeleteIds.current.delete(id)
      }
    }, 5000)
    pendingDeleteTimers.current.set(id, timer)
  }

  function handleDuplicateMov(mov) {
    setEditMov(null)
    setDuplicateData({
      tipo: mov.tipo,
      importe: String(mov.importe),
      catId: mov.categoria_id,
      subcatId: mov.subcategoria_id ?? '',
      nota: mov.nota ?? '',
      concepto: mov.concepto ?? '',
    })
    setModalKey(k => k + 1)
  }

  // ── Cargar plantillas fijas como gastos pendientes ──
  async function handleLoadPlantillas() {
    if (plantillasNoGeneradas.length === 0) { showToast(t(lang, 'no_templates')); return }
    try {
      const rows = plantillasNoGeneradas.map(p => {
        const dia = Math.min(p.dia_mes ?? 1, new Date(anio, mes, 0).getDate())
        const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        return {
          hogar_id: hogarId,
          tipo: 'gasto',
          importe: p.importe,
          fecha,
          categoria_id: p.categoria_id ?? null,
          subcategoria_id: p.subcategoria_id ?? null,
          concepto: p.nombre,
          nota: p.nota ?? null,
          es_fijo: true,
          pendiente: true,
          creado_por: profile?.id ?? null,
        }
      })
      const { error } = await supabase.from('movimientos').insert(rows)
      if (error) throw error
      loadMes()
      showToast(tFmt(lang, 'templates_loaded', { n: rows.length }))
    } catch {
      showToast(t(lang, 'save_error'), 'error')
    }
  }

  // ── Marcar gasto pendiente como pagado ──
  async function handleMarkPaid(id) {
    try {
      const { error } = await supabase.from('movimientos').update({ pendiente: false }).eq('id', id)
      if (error) throw error
      setMovimientos(prev => prev.map(m => m.id === id ? { ...m, pendiente: false } : m))
      showToast(t(lang, 'saved_ok'))
    } catch {
      showToast(t(lang, 'save_error'), 'error')
    }
  }

  // ── Marcar TODOS los gastos pendientes como pagados ──
  async function handleMarkAllPaid() {
    const ids = gastosPendientes.map(m => m.id)
    if (ids.length === 0) return
    try {
      const { error } = await supabase
        .from('movimientos')
        .update({ pendiente: false })
        .in('id', ids)
      if (error) throw error
      setMovimientos(prev => prev.map(m => ids.includes(m.id) ? { ...m, pendiente: false } : m))
      showToast(t(lang, 'saved_ok'))
    } catch {
      showToast(t(lang, 'save_error'), 'error')
    }
  }

  // ── Presupuesto: aplicar al resto del año ──
  async function handleApplyBudgetToYear() {
    if (presupuestos.length === 0) return
    const remaining = []
    for (let m = mes + 1; m <= 12; m++) {
      remaining.push({ anio, mes: m })
    }
    if (remaining.length === 0) {
      showToast(lang === 'es' ? 'Ya es diciembre' : 'Already December')
      return
    }
    const confirmed = window.confirm(
      lang === 'es'
        ? `¿Copiar el presupuesto de ${MONTHS.es[mes - 1]} a los ${remaining.length} meses restantes del año?`
        : `Copy ${MONTHS.en[mes - 1]}'s budget to the remaining ${remaining.length} months of the year?`
    )
    if (!confirmed) return
    try {
      const rows = presupuestos.flatMap(p =>
        remaining.map(rm => ({
          hogar_id: hogarId,
          categoria_id: p.categoria_id,
          anio: rm.anio,
          mes: rm.mes,
          importe: p.importe,
        }))
      )
      const { error } = await supabase
        .from('presupuestos')
        .upsert(rows, { onConflict: 'hogar_id,categoria_id,anio,mes' })
      if (error) throw error
      showToast(lang === 'es' ? `Presupuesto copiado a ${remaining.length} meses` : `Budget copied to ${remaining.length} months`)
    } catch {
      showToast(t(lang, 'save_error'), 'error')
    }
  }

  // ── Presupuesto: copiar del mes anterior ──
  async function handleCopyBudgetFromLastMonth() {
    const d = new Date(anio, mes - 2, 1)
    try {
      const { data, error: fetchErr } = await supabase
        .from('presupuestos')
        .select('categoria_id, importe')
        .eq('hogar_id', hogarId)
        .eq('anio', d.getFullYear())
        .eq('mes', d.getMonth() + 1)
      if (fetchErr) throw fetchErr
      if (!data || data.length === 0) {
        showToast(t(lang, 'no_budget_prev'))
        return
      }
      const { error: upsertErr } = await supabase
        .from('presupuestos')
        .upsert(
          data.map(p => ({ hogar_id: hogarId, categoria_id: p.categoria_id, anio, mes, importe: p.importe })),
          { onConflict: 'hogar_id,categoria_id,anio,mes' }
        )
      if (upsertErr) throw upsertErr
      loadMes()
      showToast(t(lang, 'saved_ok'))
    } catch {
      showToast(t(lang, 'save_error'), 'error')
    }
  }

  // ── Presupuesto: guardar desde el input inline ──
  async function handleSaveBudget(catId, rawValue) {
    const importe = Math.max(0, parseFloat(rawValue) || 0)
    try {
      const { error } = await supabase
        .from('presupuestos')
        .upsert(
          { hogar_id: hogarId, categoria_id: catId, anio, mes, importe },
          { onConflict: 'hogar_id,categoria_id,anio,mes' }
        )
      if (error) throw error
      setEditBudget(null)
      loadMes()
    } catch {
      showToast(t(lang, 'save_error'), 'error')
      setEditBudget(null)
    }
  }

  // ── Exportar CSV del mes (respeta el filtro activo) ──
  function exportarCSV() {
    const source = hayFiltroActivo ? movimientosFiltrados : movimientos
    const header = ['fecha', 'tipo', 'concepto', 'importe', 'categoria', 'subcategoria', 'fijo', 'pendiente', 'nota'].join(',')
    const rows = source.map(m => [
      m.fecha,
      m.tipo,
      `"${(m.concepto || '').replace(/"/g, '""')}"`,
      Number(m.importe).toFixed(2),
      `"${catName(m.categoria_id).replace(/"/g, '""')}"`,
      `"${subcatName(m.subcategoria_id).replace(/"/g, '""')}"`,
      m.es_fijo ? '1' : '0',
      m.pendiente ? '1' : '0',
      `"${(m.nota || '').replace(/"/g, '""')}"`,
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finanzas-${anio}-${String(mes).padStart(2, '0')}${hayFiltroActivo ? '-filtrado' : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Exportar CSV anual ──
  function exportarCSVAnio() {
    if (!yearData) return
    const header = ['mes', 'ingresos', 'gastos', 'balance'].join(',')
    const rows = yearData.map((d, i) => [
      MONTHS[lang][i],
      Number(d.income).toFixed(2),
      Number(d.expenses).toFixed(2),
      Number(d.income - d.expenses).toFixed(2),
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finanzas-${anio}-resumen-anual.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Cerrar sesión ──
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // ── Resumen calculado ──
  const { gastosItems, ingresosItems, totalGastos, totalIngresos, balance, gastosFijos, gastosVariables } = useMemo(() => {
    const gi = movimientos.filter(m => m.tipo === 'gasto')
    const ii = movimientos.filter(m => m.tipo === 'ingreso')
    const tg = gi.reduce((s, m) => s + Number(m.importe), 0)
    const ti = ii.reduce((s, m) => s + Number(m.importe), 0)
    const gf = gi.filter(m => m.es_fijo)
    const gv = gi.filter(m => !m.es_fijo)
    return { gastosItems: gi, ingresosItems: ii, totalGastos: tg, totalIngresos: ti, balance: ti - tg, gastosFijos: gf, gastosVariables: gv }
  }, [movimientos])

  const totalFijos = useMemo(() => gastosFijos.reduce((s, m) => s + Number(m.importe), 0), [gastosFijos])
  const totalVariables = useMemo(() => gastosVariables.reduce((s, m) => s + Number(m.importe), 0), [gastosVariables])

  const { gastosPendientes, gastosRealizados, totalPendiente } = useMemo(() => {
    const pend = gastosItems.filter(m => m.pendiente)
    const real = gastosItems.filter(m => !m.pendiente)
    return {
      gastosPendientes: pend,
      gastosRealizados: real,
      totalPendiente: pend.reduce((s, m) => s + Number(m.importe), 0),
    }
  }, [gastosItems])

  const savingsRate = totalIngresos > 0
    ? Math.round((balance / totalIngresos) * 100)
    : null

  // Which active plantillas are not yet in this month's movements
  const plantillasNoGeneradas = useMemo(() => {
    const activasIds = plantillas.filter(p => p.activa).map(p => p.id)
    if (activasIds.length === 0) return []
    // A template is "loaded" if there's a movement in this month with matching concepto OR categoria_id
    // We use a simple heuristic: a template is present if any fijo movement in this month
    // has the same categoria_id and importe (approximate match)
    const fijosDelMes = gastosItems.filter(m => m.es_fijo)
    return plantillas.filter(p => p.activa).filter(p => {
      return !fijosDelMes.some(m =>
        m.categoria_id === p.categoria_id &&
        Math.abs(Number(m.importe) - Number(p.importe)) < 0.01
      )
    })
  }, [plantillas, gastosItems])

  const deltaIngresos = prevTotals?.ingresos > 0 ? (totalIngresos - prevTotals.ingresos) / prevTotals.ingresos * 100 : null
  const deltaGastos   = prevTotals?.gastos   > 0 ? (totalGastos   - prevTotals.gastos)   / prevTotals.gastos   * 100 : null
  // Rollover: balance from the previous month (shows if they saved or overspent last month)
  const rolloverBalance = prevTotals ? prevTotals.ingresos - prevTotals.gastos : null

  const movimientosFiltrados = useMemo(() => {
    let list = movimientos
      .filter(m => filtroTipo === 'all' || m.tipo === filtroTipo)
      .filter(m => !filtroCatId || (filtroCatId === 'nocat' ? !m.categoria_id : m.categoria_id === filtroCatId))
      .filter(m => filtroFijo === null || (filtroFijo === true ? m.es_fijo : !m.es_fijo))
      .filter(m => !filtroPendiente || m.pendiente)
      .filter(m => {
        if (!busqueda) return true
        const q = busqueda.toLowerCase()
        const creatorName = m.creado_por === profile?.id
          ? t(lang, 'you').toLowerCase()
          : (usuarios.find(u => u.id === m.creado_por)?.nombre ?? '').toLowerCase()
        return (
          (m.concepto || '').toLowerCase().includes(q) ||
          (catMap.get(m.categoria_id) ?? '').toLowerCase().includes(q) ||
          (subcatMap.get(m.subcategoria_id) ?? '').toLowerCase().includes(q) ||
          (m.nota || '').toLowerCase().includes(q) ||
          String(Number(m.importe).toFixed(2)).includes(q) ||
          creatorName.includes(q)
        )
      })
    if (sortMovs === 'importe') {
      list = [...list].sort((a, b) => Number(b.importe) - Number(a.importe))
    }
    return list
  }, [movimientos, filtroTipo, filtroCatId, busqueda, sortMovs, catMap, subcatMap, usuarios, profile?.id, lang, filtroFijo, filtroPendiente])

  const totalFiltrado = useMemo(
    () => movimientosFiltrados.reduce((s, m) => s + Number(m.importe), 0),
    [movimientosFiltrados]
  )
  const hayFiltroActivo = filtroTipo !== 'all' || busqueda || filtroCatId || filtroFijo !== null || filtroPendiente

  const gastosPorUsuario = useMemo(() => {
    if (usuarios.length < 2) return null
    return usuarios.map(u => ({
      id: u.id,
      nombre: u.id === profile?.id ? t(lang, 'you') : u.nombre,
      total: gastosItems.filter(m => m.creado_por === u.id).reduce((s, m) => s + Number(m.importe), 0),
    }))
  }, [usuarios, gastosItems, profile?.id, lang])

  const ingresosPorCat = useMemo(() => {
    if (ingresosItems.length === 0) return []
    const byCat = {}
    ingresosItems.forEach(m => {
      const key = m.categoria_id ?? '__none'
      byCat[key] = (byCat[key] ?? 0) + Number(m.importe)
    })
    const entries = Object.entries(byCat).map(([key, total]) => ({
      catId: key === '__none' ? null : key,
      nombre: key === '__none' ? t(lang, 'no_category') : catMap.get(key) ?? t(lang, 'no_category'),
      total,
    })).sort((a, b) => b.total - a.total)
    return entries.length > 1 ? entries : []
  }, [ingresosItems, catMap, lang])

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

  const { gastoPorCat, gastoPendientePorCat, movCountByCat, gastosNoCategoria, gastoPorSubcat } = useMemo(() => {
    const gpc = {}
    const gpend = {}
    const mbc = {}
    const gps = {}
    let gnc = 0
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => {
      if (m.categoria_id) {
        gpc[m.categoria_id] = (gpc[m.categoria_id] ?? 0) + Number(m.importe)
        mbc[m.categoria_id] = (mbc[m.categoria_id] ?? 0) + 1
        if (m.pendiente) {
          gpend[m.categoria_id] = (gpend[m.categoria_id] ?? 0) + Number(m.importe)
        }
      } else {
        gnc += Number(m.importe)
      }
      if (m.subcategoria_id) {
        gps[m.subcategoria_id] = (gps[m.subcategoria_id] ?? 0) + Number(m.importe)
      }
    })
    return { gastoPorCat: gpc, gastoPendientePorCat: gpend, movCountByCat: mbc, gastosNoCategoria: gnc, gastoPorSubcat: gps }
  }, [movimientos])

  const presupuestoPorCat = useMemo(
    () => Object.fromEntries(presupuestos.map(p => [p.categoria_id, Number(p.importe)])),
    [presupuestos]
  )

  const gastosCats = useMemo(() =>
    categorias
      .filter(c => c.tipo === 'gasto')
      .sort((a, b) => {
        const ra = presupuestoPorCat[a.id] > 0 ? (gastoPorCat[a.id] ?? 0) / presupuestoPorCat[a.id] : -1
        const rb = presupuestoPorCat[b.id] > 0 ? (gastoPorCat[b.id] ?? 0) / presupuestoPorCat[b.id] : -1
        if (ra >= 1 && rb < 1) return -1
        if (rb >= 1 && ra < 1) return 1
        const spentA = gastoPorCat[a.id] ?? 0
        const spentB = gastoPorCat[b.id] ?? 0
        return rb - ra || spentB - spentA
      }),
  [categorias, gastoPorCat, presupuestoPorCat])

  const totalPresupuestado = useMemo(
    () => Object.values(presupuestoPorCat).reduce((s, v) => s + v, 0),
    [presupuestoPorCat]
  )
  const totalGastadoConPresupuesto = useMemo(
    () => gastosCats.filter(c => presupuestoPorCat[c.id] > 0).reduce((s, c) => s + (gastoPorCat[c.id] ?? 0), 0),
    [gastosCats, presupuestoPorCat, gastoPorCat]
  )

  const dailyTotals = useMemo(() => {
    if (sortMovs !== 'fecha') return {}
    const totals = {}
    movimientosFiltrados.forEach(m => {
      totals[m.fecha] = (totals[m.fecha] ?? 0) + (m.tipo === 'gasto' ? -Number(m.importe) : Number(m.importe))
    })
    return totals
  }, [movimientosFiltrados, sortMovs])

  const spendingInsights = useMemo(() => {
    if (gastosItems.length === 0) return null
    // Biggest single expense
    const biggest = [...gastosItems].sort((a, b) => Number(b.importe) - Number(a.importe))[0]
    // Most expensive day
    const byDay = {}
    gastosItems.forEach(m => { byDay[m.fecha] = (byDay[m.fecha] ?? 0) + Number(m.importe) })
    const topDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
    // Weekend vs weekday split
    let weekendTotal = 0, weekdayTotal = 0
    gastosItems.forEach(m => {
      const dow = new Date(m.fecha + 'T12:00:00').getDay()
      if (dow === 0 || dow === 6) weekendTotal += Number(m.importe)
      else weekdayTotal += Number(m.importe)
    })
    return { biggest, topDay, weekendTotal, weekdayTotal }
  }, [gastosItems])

  const budgetHealthScore = useMemo(() => {
    const budgeted = gastosCats.filter(c => presupuestoPorCat[c.id] > 0)
    if (budgeted.length === 0 || isCurrentMonth) return null
    const overCount = budgeted.filter(c => (gastoPorCat[c.id] ?? 0) > presupuestoPorCat[c.id]).length
    const ratio = totalPresupuestado > 0 ? totalGastadoConPresupuesto / totalPresupuestado : null
    if (ratio === null) return null
    const overPct = overCount / budgeted.length
    // Grade: A = under 90%, no over. B = 90-100%, ≤1 over. C = 0-10% over total, ≤2 cats. D/F = more
    let grade, cls
    if (ratio <= 0.9 && overCount === 0) { grade = 'A'; cls = 'grade-a' }
    else if (ratio <= 1.0 && overPct <= 0.15) { grade = 'B'; cls = 'grade-b' }
    else if (ratio <= 1.1 && overPct <= 0.3) { grade = 'C'; cls = 'grade-c' }
    else if (ratio <= 1.25) { grade = 'D'; cls = 'grade-d' }
    else { grade = 'F'; cls = 'grade-f' }
    return { grade, cls, ratio, overCount, total: budgeted.length }
  }, [gastosCats, gastoPorCat, presupuestoPorCat, totalPresupuestado, totalGastadoConPresupuesto, isCurrentMonth])

  function fmtK(n) {
    if (n >= 10000) return `${(n / 1000).toFixed(0)}k€`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k€`
    return `${Math.round(n)}€`
  }

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
    return <div className="splash">{t(lang, 'loading')}</div>
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
        <h1
          className="header-month"
          onClick={() => monthPickerRef.current?.showPicker?.()}
          title={lang === 'es' ? 'Ir a otro mes' : 'Jump to month'}
          style={{ cursor: 'pointer' }}
        >
          {MONTHS[lang][mes - 1]} {anio}
        </h1>
        <input
          ref={monthPickerRef}
          type="month"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          max={`${todayDate.getFullYear() + 2}-12`}
          value={`${anio}-${String(mes).padStart(2, '0')}`}
          onChange={e => {
            const [y, m] = e.target.value.split('-').map(Number)
            if (!isNaN(y) && !isNaN(m)) { setAnio(y); setMes(m) }
          }}
          readOnly={false}
        />
        <button className="btn-nav" onClick={nextMes} title={t(lang, 'next_month')}>›</button>

        {!isCurrentMonth && (
          <button
            className="back-today-btn"
            onClick={() => { setAnio(todayDate.getFullYear()); setMes(todayDate.getMonth() + 1) }}
          >
            {t(lang, 'today')}
          </button>
        )}
        {isFutureMonth && (
          <span className="future-month-badge" title={t(lang, 'planning_mode')}>
            {lang === 'es' ? 'Planif.' : 'Plan'}
          </span>
        )}

        <div className="header-actions">
          <button
            className={`btn-icon${plantillasNoGeneradas.length > 0 ? ' btn-icon-pulse' : ''}`}
            onClick={() => setShowPlantillasModal(true)}
            title={t(lang, 'manage_templates')}
            aria-label={t(lang, 'manage_templates')}
          >
            ↺
            {plantillasNoGeneradas.length > 0 && (
              <span className="campana-badge">{plantillasNoGeneradas.length}</span>
            )}
          </button>
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
            {totalIngresos > 0 && savingsRate !== null && (
              <span className={`summary-savings ${balance >= 0 ? 'delta-pos' : 'delta-neg'}`}>
                {balance >= 0
                  ? `${savingsRate}% ${t(lang, 'saved')}`
                  : t(lang, 'overspent')}
              </span>
            )}
            {totalPendiente > 0 && (
              <button
                className="summary-pending-hint summary-pending-hint-btn"
                onClick={() => { setFiltroPendiente(true); setFiltroTipo('gasto') }}
                title={t(lang, 'pending')}
              >
                {tFmt(lang, 'pending_count', { n: gastosPendientes.length })} · {fmt(totalPendiente)}
              </button>
            )}
            {rolloverBalance !== null && rolloverBalance !== 0 && (totalIngresos > 0 || totalGastos > 0) && (
              <span className={`summary-rollover ${rolloverBalance >= 0 ? 'delta-pos' : 'delta-neg'}`}
                title={t(lang, 'rollover_hint')}>
                {rolloverBalance >= 0 ? '↑' : '↓'} {fmt(Math.abs(rolloverBalance))} {lang === 'es' ? 'mes ant.' : 'prev.'}
              </span>
            )}
          </div>
        </div>

        {/* Share month summary */}
        {(totalIngresos > 0 || totalGastos > 0) && !loading && (
          <button
            className="share-summary-btn"
            onClick={() => {
              const monthLabel = `${MONTHS[lang][mes - 1]} ${anio}`
              const lines = [monthLabel]
              if (totalIngresos > 0) lines.push(`${t(lang, 'total_income')}: ${fmt(totalIngresos)}`)
              if (totalGastos > 0) lines.push(`${t(lang, 'total_expenses')}: ${fmt(totalGastos)}`)
              lines.push(`${t(lang, 'balance')}: ${balance >= 0 ? '+' : ''}${fmt(balance)}`)
              if (totalPresupuestado > 0) lines.push(`${t(lang, 'budget_total')}: ${fmt(totalGastadoConPresupuesto)} / ${fmt(totalPresupuestado)}`)
              if (monthNote) lines.push(`📝 ${monthNote}`)
              navigator.clipboard?.writeText(lines.join('\n')).then(() => showToast(lang === 'es' ? 'Resumen copiado' : 'Summary copied'))
            }}
            title={lang === 'es' ? 'Copiar resumen al portapapeles' : 'Copy summary to clipboard'}
          >
            <span aria-hidden="true">📋</span>
            {lang === 'es' ? 'Copiar resumen' : 'Copy summary'}
          </button>
        )}

        {/* Budget health score (past months only) */}
        {budgetHealthScore && (
          <div className="health-score-row">
            <span className={`health-score-grade ${budgetHealthScore.cls}`}>{budgetHealthScore.grade}</span>
            <span className="health-score-label">
              {lang === 'es' ? 'Salud del presupuesto' : 'Budget health'}
              {' · '}
              {Math.round(budgetHealthScore.ratio * 100)}%
              {budgetHealthScore.overCount > 0 && (
                <> · {budgetHealthScore.overCount}/{budgetHealthScore.total} {lang === 'es' ? 'cat. sobrepasadas' : 'cats over'}</>
              )}
            </span>
          </div>
        )}

        {/* Savings goal progress */}
        {totalIngresos > 0 && (
          <div className="savings-goal-row">
            {editingGoal ? (
              <form
                className="savings-goal-form"
                onSubmit={e => { e.preventDefault(); saveGoal(goalInput) }}
              >
                <label className="savings-goal-form-label">
                  {lang === 'es' ? 'Meta de ahorro (€):' : 'Savings goal (€):'}
                </label>
                <input
                  className="savings-goal-input"
                  type="number"
                  min="0"
                  step="1"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  autoFocus
                  placeholder="0"
                  onFocus={e => e.target.select()}
                  onBlur={() => saveGoal(goalInput)}
                  onKeyDown={e => e.key === 'Escape' && setEditingGoal(false)}
                />
                <button type="submit" className="btn-sm btn-primary">
                  {t(lang, 'save')}
                </button>
                <button type="button" className="btn-sm btn-secondary"
                  onClick={() => setEditingGoal(false)}>
                  {t(lang, 'cancel')}
                </button>
              </form>
            ) : savingsGoal ? (
              <>
                <div className="savings-goal-track">
                  <div
                    className={`savings-goal-fill${balance >= savingsGoal ? ' savings-goal-done' : ''}`}
                    style={{ width: `${Math.min(100, Math.max(0, balance / savingsGoal * 100))}%` }}
                  />
                </div>
                <span className={`savings-goal-pct ${balance >= savingsGoal ? 'delta-pos' : balance < 0 ? 'delta-neg' : ''}`}>
                  {balance >= savingsGoal
                    ? '✓'
                    : `${Math.round(Math.max(0, balance) / savingsGoal * 100)}%`}
                </span>
                <button
                  className="savings-goal-label-btn"
                  onClick={() => { setGoalInput(String(savingsGoal)); setEditingGoal(true) }}
                  title={lang === 'es' ? 'Editar meta de ahorro' : 'Edit savings goal'}
                >
                  {lang === 'es' ? `Meta: ${fmt(savingsGoal)}` : `Goal: ${fmt(savingsGoal)}`}
                </button>
              </>
            ) : (
              <button
                className="savings-goal-add-btn"
                onClick={() => { setGoalInput(''); setEditingGoal(true) }}
              >
                {lang === 'es' ? '+ Meta de ahorro' : '+ Savings goal'}
              </button>
            )}
          </div>
        )}

        {/* Income by category (multiple sources) */}
        {ingresosPorCat.length > 1 && (
          <div className="income-breakdown">
            {ingresosPorCat.map(({ catId, nombre, total }) => (
              <button
                key={catId ?? '__none'}
                className={`income-src-row${filtroCatId === catId && filtroTipo === 'ingreso' ? ' income-src-active' : ''}`}
                onClick={() => {
                  const isActive = filtroCatId === catId && filtroTipo === 'ingreso'
                  setFiltroCatId(isActive ? null : catId)
                  setFiltroTipo(isActive ? 'all' : 'ingreso')
                  if (!isActive) movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                title={lang === 'es' ? `Filtrar por ${nombre}` : `Filter by ${nombre}`}
              >
                <span className="income-src-name">{nombre}</span>
                <div className="income-src-bar-track">
                  <div className="income-src-bar-fill" style={{ width: `${Math.round(total / totalIngresos * 100)}%` }} />
                </div>
                <span className="income-src-amt">{fmt(total)}</span>
                <span className="income-src-pct">{Math.round(total / totalIngresos * 100)}%</span>
              </button>
            ))}
          </div>
        )}

        {/* Fixed vs variable breakdown */}
        {totalGastos > 0 && gastosFijos.length > 0 && (
          <div className="fixed-breakdown">
            <button
              className={`fixed-pill${filtroFijo === true ? ' fixed-pill-active' : ''}`}
              onClick={() => { setFiltroFijo(filtroFijo === true ? null : true); movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
              title={lang === 'es' ? 'Filtrar gastos fijos' : 'Filter fixed expenses'}
            >
              <span className="fixed-pill-label">
                {t(lang, 'fixed_badge')} · <strong>{fmt(totalFijos)}</strong>
              </span>
              <span className="fixed-pill-pct">{Math.round(totalFijos / totalGastos * 100)}%</span>
            </button>
            <button
              className={`fixed-pill fixed-pill-var${filtroFijo === false ? ' fixed-pill-active' : ''}`}
              onClick={() => { setFiltroFijo(filtroFijo === false ? null : false); movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
              title={lang === 'es' ? 'Filtrar gastos variables' : 'Filter variable expenses'}
            >
              <span className="fixed-pill-label">
                {t(lang, 'variable')} · <strong>{fmt(totalVariables)}</strong>
              </span>
              <span className="fixed-pill-pct">{Math.round(totalVariables / totalGastos * 100)}%</span>
            </button>
          </div>
        )}

        {gastosPorUsuario && totalGastos > 0 && (() => {
          const [a, b] = gastosPorUsuario
          const settle = a && b ? Math.abs(a.total - b.total) / 2 : 0
          const debtor = a && b ? (a.total > b.total ? b : a) : null
          const creditor = a && b ? (a.total > b.total ? a : b) : null
          return (
            <div className="by-user-section">
              <div className="by-user-row">
                {gastosPorUsuario.map(u => (
                  <div key={u.id} className="by-user-item">
                    <span className="by-user-name">{u.nombre}</span>
                    <span className="by-user-amt">{fmt(u.total)}</span>
                    <div className="by-user-bar-track">
                      <div
                        className="by-user-bar-fill"
                        style={{ width: `${Math.round(u.total / totalGastos * 100)}%` }}
                      />
                    </div>
                    <span className="by-user-pct">{Math.round(u.total / totalGastos * 100)}%</span>
                  </div>
                ))}
              </div>
              {settle > 0.5 && debtor && creditor && (
                <div className="settle-row">
                  <span className="settle-label">
                    {lang === 'es'
                      ? <>{debtor.nombre} debe {fmt(settle)} a {creditor.nombre}</>
                      : <>{debtor.nombre} owes {fmt(settle)} to {creditor.nombre}</>}
                  </span>
                </div>
              )}
            </div>
          )
        })()}

        {/* Month note */}
        {!loading && monthNoteKey && (
          <div className="month-note-wrap">
            {editingNote ? (
              <form
                className="month-note-form"
                onSubmit={e => { e.preventDefault(); saveMonthNote(e.target.elements.note.value) }}
              >
                <input
                  name="note"
                  type="text"
                  className="month-note-input"
                  defaultValue={monthNote}
                  autoFocus
                  maxLength={80}
                  placeholder={lang === 'es' ? 'Nota del mes…' : 'Month note…'}
                  onKeyDown={e => { if (e.key === 'Escape') setEditingNote(false) }}
                />
                <button type="submit" className="btn-sm btn-primary">{lang === 'es' ? 'OK' : 'OK'}</button>
                <button type="button" className="btn-sm btn-secondary" onClick={() => setEditingNote(false)}>{t(lang, 'cancel')}</button>
                {monthNote && (
                  <button type="button" className="btn-sm btn-secondary" onClick={() => saveMonthNote('')}>
                    {lang === 'es' ? 'Borrar' : 'Clear'}
                  </button>
                )}
              </form>
            ) : monthNote ? (
              <button className="month-note-display" onClick={() => setEditingNote(true)}>
                <span className="month-note-icon" aria-hidden="true">📝</span>
                <span className="month-note-text">{monthNote}</span>
                <span className="month-note-edit-hint">{lang === 'es' ? 'editar' : 'edit'}</span>
              </button>
            ) : (
              <button className="month-note-add-btn" onClick={() => setEditingNote(true)}>
                <span aria-hidden="true">+</span> {lang === 'es' ? 'Nota del mes' : 'Add month note'}
              </button>
            )}
          </div>
        )}

        {/* Over-budget alert */}
        {!loading && !isFutureMonth && (() => {
          const overCats = gastosCats.filter(c => {
            const b = presupuestoPorCat[c.id]
            return b > 0 && (gastoPorCat[c.id] ?? 0) > b
          })
          if (overCats.length === 0) return null
          return (
            <div className="overbudget-alert">
              <span className="overbudget-alert-icon">⚠</span>
              <span className="overbudget-alert-text">
                {overCats.map(c => c.nombre).join(' · ')}
                {' — '}
                {lang === 'es' ? 'sobre presupuesto' : 'over budget'}
              </span>
              <button
                className="overbudget-alert-link"
                onClick={() => { setFiltroCatId(overCats[0].id); setFiltroTipo('gasto') }}
              >
                {lang === 'es' ? 'ver' : 'view'}
              </button>
            </div>
          )
        })()}

        {/* Future month planning banner */}
        {isFutureMonth && !loading && (
          <div className="planning-banner">
            <span className="planning-banner-icon">📅</span>
            <div className="planning-banner-text">
              <strong>{t(lang, 'planning_mode')}</strong>
              <span>{lang === 'es'
                ? 'Añade gastos planificados y establece presupuestos para preparar el mes.'
                : 'Add planned expenses and set budgets to prepare for this month.'}
              </span>
            </div>
          </div>
        )}

        {/* Load templates banner */}
        {!loading && plantillasNoGeneradas.length > 0 && (
          <div className="templates-banner">
            <div className="templates-banner-info">
              <span className="templates-banner-title">
                {lang === 'es'
                  ? `${plantillasNoGeneradas.length} gasto(s) fijo(s) sin cargar`
                  : `${plantillasNoGeneradas.length} recurring expense(s) not yet loaded`}
              </span>
              <span className="templates-banner-names">
                {plantillasNoGeneradas.slice(0, 3).map(p => p.nombre).join(', ')}
                {plantillasNoGeneradas.length > 3 && `… +${plantillasNoGeneradas.length - 3}`}
              </span>
            </div>
            <button
              className="btn-sm btn-primary templates-banner-btn"
              onClick={handleLoadPlantillas}
            >
              {t(lang, 'load_templates')}
            </button>
          </div>
        )}

        {!welcomeDismissed && isCurrentMonth && !loading && movimientos.length === 0 && (
          <div className="welcome-banner">
            <button className="welcome-close" onClick={dismissWelcome} aria-label="Close">✕</button>
            <p className="welcome-title">
              {lang === 'es' ? '👋 Bienvenidos' : '👋 Welcome'}
            </p>
            <ol className="welcome-steps">
              <li>{lang === 'es'
                ? <><strong>Fija presupuestos</strong> — pulsa "Sin presupuesto" en cada categoría</>
                : <><strong>Set budgets</strong> — tap "No budget" next to each category</>
              }</li>
              <li>{lang === 'es'
                ? <><strong>Añade un gasto</strong> — botón <strong>+</strong> abajo a la derecha</>
                : <><strong>Add a transaction</strong> — tap the <strong>+</strong> button bottom-right</>
              }</li>
              <li>{lang === 'es'
                ? <><strong>Invita a tu pareja</strong> — comparte esta URL y sus credenciales</>
                : <><strong>Invite your partner</strong> — share this URL and their login</>
              }</li>
            </ol>
            <button className="welcome-dismiss btn-sm btn-secondary" onClick={dismissWelcome}>
              {lang === 'es' ? 'Entendido' : 'Got it'}
            </button>
          </div>
        )}

        {showInstallBanner && (
          <div className="install-banner" role="banner">
            <span className="install-banner-icon" aria-hidden="true">📲</span>
            <span className="install-banner-text">
              {lang === 'es'
                ? 'Instala la app en tu dispositivo para acceso rápido'
                : 'Install this app on your device for quick access'}
            </span>
            <button className="install-banner-btn btn-sm btn-primary" onClick={handleInstall}>
              {lang === 'es' ? 'Instalar' : 'Install'}
            </button>
            <button className="install-banner-close btn-icon" onClick={dismissInstall} aria-label={t(lang, 'close')}>✕</button>
          </div>
        )}

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
            {/* Por categoría (gastos) */}
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">{t(lang, 'budget_section')}</h2>
                <div className="section-header-actions">
                  <button className="btn-sm btn-secondary" onClick={handleCopyBudgetFromLastMonth}>
                    {t(lang, 'copy_budget_prev')}
                  </button>
                  {presupuestos.length > 0 && mes < 12 && (
                    <button
                      className="btn-sm btn-secondary"
                      onClick={handleApplyBudgetToYear}
                      title={lang === 'es' ? 'Copiar este presupuesto a todos los meses restantes del año' : 'Copy this budget to all remaining months of the year'}
                    >
                      {lang === 'es' ? '→ año' : '→ year'}
                    </button>
                  )}
                  {gastosCats.some(c => (gastoPorCat[c.id] ?? 0) === 0 && !(presupuestoPorCat[c.id] > 0)) && (
                    <button
                      className={`btn-sm btn-secondary${hideZeroCats ? ' btn-secondary-active' : ''}`}
                      onClick={() => setHideZeroCats(h => !h)}
                      title={lang === 'es' ? 'Ocultar categorías sin gasto ni presupuesto' : 'Hide zero-spend categories'}
                    >
                      {hideZeroCats ? (lang === 'es' ? 'Mostrar todas' : 'Show all') : (lang === 'es' ? 'Ocultar ceros' : 'Hide zeros')}
                    </button>
                  )}
                  <button
                    className="btn-icon"
                    onClick={() => setShowCatsModal(true)}
                    title={t(lang, 'manage_categories')}
                    style={{ fontSize: '0.9rem' }}
                  >
                    ⚙
                  </button>
                </div>
              </div>

              {presupuestos.length === 0 && totalGastos > 0 && !loading && (
                <div className="budget-setup-banner">
                  <span className="budget-setup-text">
                    {lang === 'es'
                      ? 'Sin presupuesto para este mes — define límites por categoría para controlar el gasto.'
                      : 'No budget set — add limits per category to track spending.'}
                  </span>
                  <button className="btn-sm btn-primary" onClick={handleCopyBudgetFromLastMonth}>
                    {t(lang, 'copy_budget_prev')}
                  </button>
                </div>
              )}

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
                      {totalPendiente > 0 && totalPresupuestado > 0 && (() => {
                        const pendPct = Math.min(100 - Math.min(100, spendPct * 100), totalPendiente / totalPresupuestado * 100)
                        return pendPct > 0 ? (
                          <div
                            className="budget-bar-pending"
                            style={{ width: `${pendPct}%`, left: `${Math.min(100, spendPct * 100)}%` }}
                          />
                        ) : null
                      })()}
                      {isCurrentMonth && (
                        <div
                          className="budget-time-marker"
                          style={{ left: `${Math.min(100, timePct * 100)}%` }}
                        />
                      )}
                    </div>
                    {isCurrentMonth && (
                      <>
                        <div className="budget-pace-row">
                          <span className="budget-pace-day">
                            {tFmt(lang, 'day_of', { day: todayDate.getDate(), total: daysInMonth })}
                          </span>
                          <span className={`budget-pace-label ${paceCls}`}>{paceLabel}</span>
                        </div>
                        {totalGastos > 0 && todayDate.getDate() > 0 && (
                          <div className="budget-pace-row">
                            <span className="budget-pace-day">{t(lang, 'avg_spend_day')}</span>
                            <span className="budget-pace-label pace-ok">
                              {fmt(totalGastos / todayDate.getDate())}
                            </span>
                          </div>
                        )}
                        {timePct > 0 && timePct < 0.99 && totalGastadoConPresupuesto > 0 && (
                          <div className="budget-pace-row">
                            <span className="budget-pace-day">{t(lang, 'forecast_eom')}</span>
                            <span className={`budget-pace-label ${(totalGastadoConPresupuesto / timePct) > totalPresupuestado ? 'pace-fast' : 'pace-ok'}`}>
                              {fmt(totalGastadoConPresupuesto / timePct)}
                              {' '}
                              <span style={{ fontWeight: 400, opacity: 0.75 }}>
                                ({Math.round(totalGastadoConPresupuesto / timePct / totalPresupuestado * 100)}%)
                              </span>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })()}

              {gastosCats.length === 0
                ? <p className="empty-text">{t(lang, 'no_expense_cats')}</p>
                : gastosCats
                    .filter(cat => !hideZeroCats || (gastoPorCat[cat.id] ?? 0) > 0 || presupuestoPorCat[cat.id] > 0)
                    .map(cat => {
                    const spent = gastoPorCat[cat.id] ?? 0
                    const spentPendiente = gastoPendientePorCat[cat.id] ?? 0
                    const budget = presupuestoPorCat[cat.id] ?? 0
                    const prevSpent = prevTotals?.gastoPorCat?.[cat.id] ?? null
                    const catDelta = prevSpent !== null && prevSpent > 0 ? spent - prevSpent : null
                    const ratio = budget > 0 ? spent / budget : 0
                    const pct = Math.min(100, ratio * 100)
                    const pendingPct = budget > 0 ? Math.min(100 - pct, spentPendiente / budget * 100) : 0
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
                            {catDelta !== null && Math.abs(catDelta) >= 5 && (
                              <span
                                className={`budget-cat-delta ${catDelta > 0 ? 'delta-neg' : 'delta-pos'}`}
                                title={lang === 'es' ? `vs mes anterior: ${catDelta > 0 ? '+' : ''}${Math.round(catDelta)}€` : `vs prev month: ${catDelta > 0 ? '+' : ''}${Math.round(catDelta)}€`}
                              >
                                {catDelta > 0 ? '↑' : '↓'}{fmtK(Math.abs(catDelta))}
                              </span>
                            )}
                          </button>
                          {subcategorias.some(s => s.categoria_id === cat.id && (gastoPorSubcat[s.id] ?? 0) > 0) && (
                            <button
                              className="budget-expand-btn"
                              onClick={e => { e.stopPropagation(); toggleBudgetCat(cat.id) }}
                              aria-label={expandedBudgetCats.has(cat.id) ? 'Colapsar subcategorías' : 'Expandir subcategorías'}
                              aria-expanded={expandedBudgetCats.has(cat.id)}
                            >
                              {expandedBudgetCats.has(cat.id) ? '▾' : '▸'}
                            </button>
                          )}
                          <div className="budget-amounts">
                            <span className="budget-spent">{fmt(spent)}</span>
                            {editBudget?.catId === cat.id ? (
                              <input
                                className="budget-inline-input"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={budget > 0 ? budget : (spent > 0 ? Math.ceil(spent / 10) * 10 : '')}
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
                              <>
                                <button
                                  className={`budget-limit-btn${budget === 0 && spent > 0 ? ' budget-limit-btn-hint' : ''}`}
                                  onClick={() => setEditBudget({ catId: cat.id })}
                                  title={budget === 0 && spent > 0
                                    ? (lang === 'es' ? `Fijar presupuesto — sugerido: ${fmt(Math.ceil(spent / 10) * 10)}` : `Set budget — suggested: ${fmt(Math.ceil(spent / 10) * 10)}`)
                                    : t(lang, 'set_budget')}
                                >
                                  {budget > 0 ? `/ ${fmt(budget)}` : t(lang, 'no_budget')}
                                </button>
                                <button
                                  className="budget-add-btn"
                                  onClick={e => { e.stopPropagation(); setEditMov(null); setQuickAddCatId(cat.id); setModalOpen(true) }}
                                  title={`${t(lang, 'new_movement')} — ${cat.nombre}`}
                                  aria-label={`${t(lang, 'new_movement')} — ${cat.nombre}`}
                                >+</button>
                              </>
                            )}
                          </div>
                        </div>
                        {budget > 0 && (
                          <div className="budget-bar-wrap">
                            <div className="budget-bar-track">
                              <div className={`budget-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
                              {pendingPct > 0 && (
                                <div
                                  className="budget-bar-pending"
                                  style={{ width: `${pendingPct}%`, left: `${pct}%` }}
                                />
                              )}
                            </div>
                            <span className={`budget-bar-pct ${pctCls}`} title={`${Math.round(ratio * 100)}%`}>
                              {pctLabel}
                            </span>
                          </div>
                        )}
                        {isCurrentMonth && budget > 0 && spent < budget && (() => {
                          const daysLeft = new Date(anio, mes, 0).getDate() - todayDate.getDate()
                          const remaining = budget - spent - spentPendiente
                          if (daysLeft <= 0 || remaining <= 0) return null
                          const daily = remaining / daysLeft
                          return (
                            <span className="budget-daily-hint">
                              {fmt(daily)}/{lang === 'es' ? 'día' : 'day'} · {fmt(remaining)} {lang === 'es' ? 'restante' : 'left'}
                            </span>
                          )
                        })()}
                        {expandedBudgetCats.has(cat.id) && (() => {
                          const subcats = subcategorias.filter(s => s.categoria_id === cat.id && (gastoPorSubcat[s.id] ?? 0) > 0)
                          if (subcats.length === 0) return null
                          return (
                            <div className="budget-subcats">
                              {subcats.sort((a, b) => (gastoPorSubcat[b.id] ?? 0) - (gastoPorSubcat[a.id] ?? 0)).map(s => {
                                const subSpent = gastoPorSubcat[s.id] ?? 0
                                const subPct = spent > 0 ? Math.round(subSpent / spent * 100) : 0
                                return (
                                  <div key={s.id} className="budget-subcat-row">
                                    <span className="budget-subcat-name">{s.nombre}</span>
                                    <span className="budget-subcat-amt">{fmt(subSpent)}</span>
                                    <span className="budget-subcat-pct">{subPct}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })
              }
              {gastosNoCategoria > 0 && (
                <div className="budget-row budget-row-nocat">
                  <div className="budget-row-top">
                    <button
                      className="budget-cat-name budget-cat-btn"
                      onClick={() => {
                        const next = filtroCatId === 'nocat' ? null : 'nocat'
                        setFiltroCatId(next)
                        if (next) movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                    >
                      <span className="budget-cat-dot" style={{ background: 'var(--text3)' }} />
                      {t(lang, 'no_category')}
                    </button>
                    <div className="budget-amounts">
                      <span className="budget-spent">{fmt(gastosNoCategoria)}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>


            {/* Movimientos */}
            <section className="section" ref={movListRef}>
              <div className="section-header">
                <h2 className="section-title">{t(lang, 'movements_section')}</h2>
                <div className="section-header-actions">
                  <button className="btn-sm btn-secondary" onClick={() => setShowImportModal(true)}>
                    {t(lang, 'import_csv')}
                  </button>
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
                      {gastosFijos.length > 0 && (
                        <button
                          className={`filter-tab filter-tab-fixed${filtroFijo === true ? ' filter-tab-active' : ''}`}
                          onClick={() => { setFiltroFijo(filtroFijo === true ? null : true); setFiltroPendiente(false); if (filtroFijo !== true) setFiltroTipo('gasto') }}
                        >
                          {t(lang, 'fixed_badge')}
                          <span className="tab-count">{gastosFijos.length}</span>
                        </button>
                      )}
                      {gastosPendientes.length > 0 && (
                        <button
                          className={`filter-tab filter-tab-pending${filtroPendiente ? ' filter-tab-active' : ''}`}
                          onClick={() => { setFiltroPendiente(p => !p); setFiltroFijo(null); if (!filtroPendiente) setFiltroTipo('gasto') }}
                        >
                          {t(lang, 'pending_badge')}
                          <span className="tab-count">{gastosPendientes.length}</span>
                        </button>
                      )}
                    </div>
                    <button
                      className={`sort-btn${sortMovs === 'importe' ? ' sort-btn-active' : ''}`}
                      onClick={() => setSortMovs(s => {
        const next = s === 'fecha' ? 'importe' : 'fecha'
        localStorage.setItem('sortMovs', next)
        return next
      })}
                      title={sortMovs === 'fecha' ? t(lang, 'sort_by_amount') : t(lang, 'sort_by_date')}
                    >
                      {sortMovs === 'fecha' ? t(lang, 'sort_by_date') : t(lang, 'sort_by_amount')}
                    </button>
                    <button
                      className={`sort-btn${compactMode ? ' sort-btn-active' : ''}`}
                      onClick={() => setCompactMode(v => { const next = !v; localStorage.setItem('compactMode', next ? '1' : ''); return next })}
                      title={compactMode ? (lang === 'es' ? 'Vista normal' : 'Normal view') : (lang === 'es' ? 'Vista compacta' : 'Compact view')}
                    >
                      {compactMode ? '⊟' : '⊞'}
                    </button>
                  </div>
                  {filtroPendiente && gastosPendientes.length > 0 && (
                    <div className="pending-actions-row">
                      <span className="pending-actions-label">
                        {tFmt(lang, 'pending_count', { n: gastosPendientes.length })} · {fmt(totalPendiente)}
                      </span>
                      <button className="btn-sm btn-mark-all-paid" onClick={handleMarkAllPaid}>
                        {t(lang, 'mark_all_paid')}
                      </button>
                    </div>
                  )}
                  <div className="search-wrap">
                    <input
                      ref={searchRef}
                      className="search-input"
                      type="search"
                      placeholder={t(lang, 'search_movements')}
                      aria-label={t(lang, 'search_movements')}
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                      <button className="search-clear" onClick={() => setBusqueda('')}>×</button>
                    )}
                  </div>
                  {(() => {
                    // Quick-filter chips: categories present in current type-filtered, search-filtered movs
                    const typeFiltered = movimientos.filter(m => {
                      if (filtroTipo !== 'all' && m.tipo !== filtroTipo) return false
                      if (busqueda) {
                        const q = busqueda.toLowerCase()
                        const name = catMap.get(m.categoria_id) ?? ''
                        if (!m.concepto?.toLowerCase().includes(q) && !name.toLowerCase().includes(q) && !m.nota?.toLowerCase().includes(q)) return false
                      }
                      return true
                    })
                    const catsInView = [...new Set(typeFiltered.map(m => m.categoria_id ?? 'nocat'))]
                    if (catsInView.length < 2) return null
                    return (
                      <div className="cat-chips-row" role="group" aria-label={t(lang, 'filter_by_category')}>
                        {catsInView.map(cid => {
                          const color = cid === 'nocat' ? 'var(--text3)' : (catColorMap[cid] ?? 'var(--accent)')
                          const name = cid === 'nocat' ? t(lang, 'no_category') : (catMap.get(cid) ?? '?')
                          const active = filtroCatId === cid
                          return (
                            <button
                              key={cid}
                              className={`cat-chip${active ? ' cat-chip-active' : ''}`}
                              style={{ '--chip-color': color }}
                              onClick={() => setFiltroCatId(active ? null : cid)}
                              aria-pressed={active}
                            >
                              <span className="cat-chip-dot" aria-hidden="true" />
                              {name}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {filtroCatId && (
                    <div className="cat-filter-chip">
                      <span>{filtroCatId === 'nocat' ? t(lang, 'no_category') : catName(filtroCatId)}</span>
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
                    <div className="empty-actions">
                      {busqueda.trim() && (
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => {
                            setDuplicateData({ tipo: 'gasto', importe: '', catId: filtroCatId && filtroCatId !== 'nocat' ? filtroCatId : null, subcatId: '', nota: '', concepto: busqueda.trim() })
                            setModalKey(k => k + 1)
                            setEditMov(null)
                            setBusqueda('')
                            setModalOpen(true)
                          }}
                        >
                          {lang === 'es' ? `+ Añadir "${busqueda.trim()}"` : `+ Add "${busqueda.trim()}"`}
                        </button>
                      )}
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => { setFiltroTipo('all'); setBusqueda(''); setFiltroCatId(null); setFiltroFijo(null); setFiltroPendiente(false) }}
                      >
                        {t(lang, 'clear_filters')}
                      </button>
                    </div>
                  ) : (
                    <div className="empty-actions">
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => { setEditMov(null); setModalOpen(true) }}
                      >
                        {t(lang, 'add_movement')}
                      </button>
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => setShowImportModal(true)}
                      >
                        {t(lang, 'import_csv')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`movements-list${compactMode ? ' movements-compact' : ''}`}>
                  {renderList.map((entry, idx) => {
                    if (entry.type === 'header') {
                      const dt = dailyTotals[entry.date]
                      return (
                        <div key={`h-${entry.date}`} className="movement-date-header">
                          <span>{formatFecha(entry.date)}</span>
                          {dt !== undefined && (
                            <span className={`daily-total ${dt >= 0 ? 'amount-income' : 'amount-expense'}`}>
                              {dt >= 0 ? '+' : ''}{fmt(dt)}
                            </span>
                          )}
                        </div>
                      )
                    }
                    const m = entry.m
                    const sub = subcatName(m.subcategoria_id)
                    return (
                      <div
                        key={m.id}
                        className={`movement-item-wrap${m.pendiente ? ' movement-item-wrap-pending' : ''}`}
                      >
                      <button
                        className={`movement-item${m.pendiente ? ' movement-item-pending' : ''}`}
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
                          <span className="movement-title">
                            {m.categoria_id && catColorMap[m.categoria_id] && (
                              <span
                                className="movement-cat-dot"
                                style={{ background: catColorMap[m.categoria_id] }}
                              />
                            )}
                            {m.concepto || catName(m.categoria_id)}
                          </span>
                          {m.concepto && (
                            <span className="movement-cat">
                              {catName(m.categoria_id)}{sub ? ` · ${sub}` : ''}
                            </span>
                          )}
                          {m.es_fijo && (
                            <span className="movement-fixed-badge">{t(lang, 'fixed_badge')}</span>
                          )}
                          {m.nota && <span className="movement-nota">{m.nota}</span>}
                        </div>
                        <div className="movement-right">
                          {m.pendiente && (
                            <span className="movement-pending-badge">{t(lang, 'pending_badge')}</span>
                          )}
                          <span className={`movement-amount ${m.tipo === 'gasto' ? 'amount-expense' : 'amount-income'}${m.pendiente ? ' amount-pending' : ''}`}>
                            {m.tipo === 'gasto' ? '-' : '+'}{fmt(Number(m.importe))}
                          </span>
                        </div>
                      </button>
                      {m.pendiente && m.tipo === 'gasto' && (
                        <button
                          className="mark-paid-btn"
                          onClick={e => { e.stopPropagation(); handleMarkPaid(m.id) }}
                          title={t(lang, 'mark_paid')}
                        >
                          {lang === 'es' ? '✓ Pagado' : '✓ Paid'}
                        </button>
                      )}
                      </div>
                    )
                  })}
                </div>
              )}
              {movimientosFiltrados.length > 1 && (
                <div className="movements-footer">
                  <span className="movements-footer-count">{movimientosFiltrados.length}</span>
                  {hayFiltroActivo ? (
                    <span className="movements-footer-total">{fmt(totalFiltrado)}</span>
                  ) : (
                    <>
                      {totalGastos > 0 && <span className="movements-footer-exp">−{fmt(totalGastos)}</span>}
                      {totalPendiente > 0 && (
                        <span className="movements-footer-pending">
                          {lang === 'es' ? `(${fmt(totalPendiente)} pte.)` : `(${fmt(totalPendiente)} pend.)`}
                        </span>
                      )}
                      {totalIngresos > 0 && <span className="movements-footer-inc">+{fmt(totalIngresos)}</span>}
                    </>
                  )}
                </div>
              )}
            </section>
            {/* Gráficas */}
            <GraficasMes
              lang={lang}
              gastoPorCat={gastoPorCat}
              categorias={categorias}
              trendData={trendData}
              fmt={fmt}
              catColors={catColorMap}
              catMap={catMap}
              insights={spendingInsights}
              selectedCatId={filtroCatId && filtroCatId !== 'nocat' ? filtroCatId : null}
              onSelectCat={catId => {
                setFiltroCatId(catId)
                setFiltroTipo(catId ? 'gasto' : 'all')
                if (catId) movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            />

            {/* Resumen anual */}
            <section className="section section-year">
              <div className="section-header">
                <h2 className="section-title">{lang === 'es' ? `Año ${anio}` : `Year ${anio}`}</h2>
                <div className="section-header-actions">
                  {showYearView && yearData && (
                    <button className="btn-sm btn-secondary" onClick={exportarCSVAnio}>
                      {t(lang, 'export_csv')}
                    </button>
                  )}
                  <button
                    className="btn-sm btn-secondary"
                    onClick={() => setShowYearView(v => !v)}
                  >
                    {showYearView ? t(lang, 'year_hide') : t(lang, 'year_show')}
                  </button>
                </div>
              </div>
              {showYearView && (
                yearLoading ? (
                  <div className="loading-row">{t(lang, 'loading')}</div>
                ) : yearData ? (
                  <>
                  {(() => {
                    const yearIncome = yearData.reduce((s, d) => s + d.income, 0)
                    const yearExpenses = yearData.reduce((s, d) => s + d.expenses, 0)
                    const yearBalance = yearIncome - yearExpenses
                    const hasData = yearIncome > 0 || yearExpenses > 0
                    return hasData ? (
                      <div className="year-totals-row">
                        <span className="year-totals-item year-totals-inc">+{fmtK(yearIncome)}</span>
                        <span className="year-totals-sep">·</span>
                        <span className="year-totals-item year-totals-exp">−{fmtK(yearExpenses)}</span>
                        <span className="year-totals-sep">·</span>
                        <span className={`year-totals-item ${yearBalance >= 0 ? 'year-bal-pos' : 'year-bal-neg'}`}>
                          {yearBalance >= 0 ? '+' : ''}{fmtK(yearBalance)}
                        </span>
                      </div>
                    ) : null
                  })()}
                  <div className="year-grid">
                    {yearData.map((d, i) => {
                      const monthBalance = d.income - d.expenses
                      const isCurrent = i + 1 === todayDate.getMonth() + 1 && anio === todayDate.getFullYear()
                      const isEmpty = d.income === 0 && d.expenses === 0
                      const isFutureCell = anio === todayDate.getFullYear()
                        ? i + 1 > todayDate.getMonth() + 1
                        : anio > todayDate.getFullYear()
                      const isSelectedMonth = i + 1 === mes
                      const plantillaTotal = isFutureCell
                        ? plantillas.filter(p => p.activa).reduce((s, p) => s + Number(p.importe), 0)
                        : 0
                      return (
                        <button
                          key={i}
                          className={`year-cell${isCurrent ? ' year-cell-current' : ''}${isSelectedMonth && !isCurrent ? ' year-cell-selected' : ''}${isEmpty && !isFutureCell ? ' year-cell-empty' : ''}${isFutureCell ? ' year-cell-future' : ''}`}
                          onClick={() => setMes(i + 1)}
                          title={`${MONTHS[lang][i]}${!isEmpty ? ` · ${lang === 'es' ? 'ingresos' : 'income'}: ${fmtK(d.income)}` : ''}`}
                        >
                          <span className="year-cell-month">{MONTHS[lang][i].slice(0, 3)}</span>
                          {!isEmpty ? (
                            <>
                              {d.income > 0 && (
                                <span className="year-cell-inc">{fmtK(d.income)}</span>
                              )}
                              <span className="year-cell-exp">{fmtK(d.expenses)}</span>
                              <span className={`year-cell-bal ${monthBalance >= 0 ? 'year-bal-pos' : 'year-bal-neg'}`}>
                                {monthBalance >= 0 ? '+' : ''}{fmtK(monthBalance)}
                              </span>
                            </>
                          ) : isFutureCell && plantillaTotal > 0 ? (
                            <span className="year-cell-projected">{fmtK(plantillaTotal)}</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  </>
                ) : null
              )}
            </section>
          </>
        )}
      </main>

      {/* Modal plantillas fijas */}
      <PlantillasModal
        open={showPlantillasModal}
        onClose={() => setShowPlantillasModal(false)}
        lang={lang}
        hogarId={hogarId}
        categorias={categorias}
        subcategorias={subcategorias}
        onRefresh={loadStaticos}
      />

      {/* Modal categorías */}
      <CategoriasModal
        open={showCatsModal}
        onClose={() => setShowCatsModal(false)}
        lang={lang}
        hogarId={hogarId}
        onRefresh={loadStaticos}
      />

      {/* Modal importar CSV */}
      <ImportarCSVModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        lang={lang}
        hogarId={hogarId}
        userId={profile?.id}
        categorias={categorias}
        anio={anio}
        mes={mes}
        onImported={(n) => { loadMes(); setShowImportModal(false); showToast(tFmt(lang, 'imported_ok', { n })) }}
      />

      {/* Modal movimiento */}
      <MovimientoModal
        key={modalKey}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMov(null); setQuickAddCatId(null); setDuplicateData(null) }}
        onSave={handleSaveMov}
        onDelete={handleDeleteMov}
        onDuplicate={editMov ? handleDuplicateMov : null}
        movimiento={editMov}
        categorias={categorias}
        subcategorias={subcategorias}
        hogarId={hogarId}
        userId={profile?.id}
        defaultTipo={duplicateData?.tipo ?? (filtroTipo !== 'all' ? filtroTipo : 'gasto')}
        defaultCatId={!editMov ? (duplicateData?.catId ?? quickAddCatId ?? (filtroTipo !== 'ingreso' && filtroCatId !== 'nocat' ? filtroCatId : null)) : null}
        defaultImporte={!editMov ? (duplicateData?.importe ?? '') : ''}
        defaultSubcatId={!editMov ? (duplicateData?.subcatId ?? '') : ''}
        defaultNota={!editMov ? (duplicateData?.nota ?? '') : ''}
        defaultConcepto={!editMov ? (duplicateData?.concepto ?? '') : ''}
        recentConceptos={recentConceptos}
        gastoPorCat={gastoPorCat}
        presupuestoPorCat={presupuestoPorCat}
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
                  ['I', lang === 'es' ? 'Importar CSV' : 'Import CSV'],
                  ['E', lang === 'es' ? 'Exportar CSV' : 'Export CSV'],
                  ['T', lang === 'es' ? 'Ir al mes actual' : 'Go to current month'],
                  ['Y', lang === 'es' ? 'Resumen anual' : 'Year summary'],
                  ['G', lang === 'es' ? 'Ir a gráficas' : 'Go to charts'],
                  ['P', lang === 'es' ? 'Filtrar pendientes' : 'Toggle pending filter'],
                  ['F', lang === 'es' ? 'Filtrar gastos fijos' : 'Toggle fixed filter'],
                  ['X', lang === 'es' ? 'Limpiar todos los filtros' : 'Clear all filters'],
                  ['C', lang === 'es' ? 'Gestionar categorías' : 'Manage categories'],
                  ['R', lang === 'es' ? 'Gastos fijos recurrentes' : 'Recurring templates'],
                  ['/', lang === 'es' ? 'Enfocar búsqueda' : 'Focus search'],
                  ['?', lang === 'es' ? 'Mostrar / ocultar atajos' : 'Show / hide shortcuts'],
                  ['D', lang === 'es' ? 'Alternar tema oscuro/claro' : 'Toggle dark/light theme'],
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
      <button
        className={`fab${modalOpen || showActivity || showHelp || showCatsModal || showImportModal || showPlantillasModal ? ' fab-hidden' : ''}`}
        onClick={() => { setEditMov(null); setModalOpen(true) }}
        title={t(lang, 'new_movement')}
        aria-label={t(lang, 'new_movement')}
        aria-hidden={modalOpen || showActivity || showHelp || showCatsModal || showImportModal || showPlantillasModal}
        tabIndex={modalOpen || showActivity || showHelp || showCatsModal || showImportModal || showPlantillasModal ? -1 : 0}
      >
        +
      </button>

      {/* Toast */}
      {toast && (
        <div className={`toast${toast.type === 'error' ? ' toast-error' : ''}`} role="status" aria-live="polite">
          {toast.onUndo ? (
            <span className="toast-actions">
              <span>{toast.msg}</span>
              <button
                className="toast-undo-btn"
                onClick={() => {
                  if (toastTimer.current) clearTimeout(toastTimer.current)
                  setToast(null)
                  toast.onUndo()
                }}
              >{t(lang, 'undo')}</button>
            </span>
          ) : toast.msg}
        </div>
      )}
    </div>
  )
}
