# ESTADO — finanzas-pareja

**Fecha:** 2026-06-11 (tarde)
**Estado:** Activo — **25 sprints APLICADOS en código** (sesión 2026-06-11). Pendiente: migraciones SQL en Supabase + push.

---

## Estado actual

App React + Vite PWA con Supabase. **Build limpio (vite build OK, eslint sin errores nuevos).**

### ✅ Sprints aplicados en esta sesión (2026-06-11)

- **Bloque 1**: Sprint A (5 bugs) · CSV-SUBCAT (bug subcategorías import) · KB (atajo 'A' + `npm uninstall react-router-dom`)
- **Bloque 2**: ACT-NAV · IMPORTE-SUGGEST · GUIDE · INPUTMODE · CSV2 · OFFLINE · EFECT-FILTER · CAT-REORDER · TREND-NAV · T2
- **Bloque 3**: V1 (nota mes → BD, req. migración 011) · U7 (meta ahorro → BD, req. 012) · RESTORE
- **Bloque 4**: REALTIME-FULL · GR · X · B (Z1+Z2+Z3+Z8) · C (9 quick wins) · D (traducciones) · E (a11y 7 modales + menú ⋯) · P (plantillas, req. 013) · CSV (A3+A6; CSV5/CSV6 ya cubiertos en CSV-SUBCAT)

**NO aplicados (decisión vigente):**
- Sprint SHARE — descartado por Ángel.
- Sprint LOGIN-PWD — opcional; solo si se configura SMTP o se añaden usuarios.

Notas de integración:
- ACT-NAV y B-1 fusionados: item de movimiento clicable (highlight 3 s) + chip "→ mes" en el resto de actividades con payload.
- EFECT-FILTER y C-2 comparten un único estado `filtroMetodo`; el chip "💵 Efectivo" lo alterna.
- Sin migraciones aplicadas, V1/U7/P degradan sin romper nada (nota/meta no se muestran; en plantillas solo falla guardar tipo/método).
- CSS de todos los sprints agrupado al final de `App.css`.

### ⚠️ PENDIENTE para activarlo todo (lo hace Ángel)
1. Aplicar migraciones en Supabase SQL Editor, EN ORDEN: 005 → 006 → 007 → 008 → 009 → 010 → 011 → 012 → 013.
2. Push del repo vía GitHub Desktop (commits locales acumulados).

> Los diffs de sprint que siguen más abajo quedan como **referencia histórica**: ya están aplicados.

### Fix crítico aplicado (sesión 2026-06-10 tarde)
- `todayStr` añadido a scope del componente MesView (línea 29). Estaba solo definido dentro de `formatFecha()` causando `ReferenceError` al renderizar el botón "Hoy" y el indicador gasto-vs-media.
- `BusquedaGlobal` call site actualizado para recibir `catColorMap` y `catIconMap`.

### Migraciones pendientes de aplicar en Supabase SQL Editor (en orden)
1. `supabase/migrations/005_presupuestos_subcat.sql`
2. `supabase/migrations/006_plantillas_frecuencia.sql`
3. `supabase/migrations/007_cat_emoji.sql`
4. `supabase/migrations/008_efectivo.sql` — añade columna `metodo_pago` a movimientos
5. `supabase/migrations/009_default_categories.sql` — añade categorías/subcategorías por defecto

### Pendiente de push
- Esta sesión: ~30 commits acumulados. Ángel hace push vía GitHub Desktop.

---

## Mejoras implementadas en esta sesión (2026-06-10)

### UX — Modal de movimiento
- Categorías como grid de chips visuales (emoji/color) en vez de `<select>` cuando ≤12 cats
- Subcategorías como chips, visibles sin "Más opciones"
- `autoFocus` siempre en campo importe (también al editar)
- Budget hint reactivo al importe actual mientras se escribe
- "Guardar y otro" (`onSaveAndAnother`) — añade y mantiene el modal abierto
- Quick-add `+` por subcategoría en filas del presupuesto
- `catColorMap` y `catIconMap` pasados al modal

### UX — Listado de movimientos
- Running balance acumulado por movimiento (solo en sort por fecha, sin filtros activos)
- Menú contextual rápido (longpress 450ms / right-click): editar, marcar pagado/cobrado, duplicar, eliminar
- Highlight del texto buscado (marca amarilla en el concepto)
- Botón "Hoy" en barra de filtros (solo si hay movimientos hoy en el mes actual)
- Indicador de gasto hoy vs media diaria (al filtrar por Hoy)

### UX — Emojis en categorías
- `catIconMap` en MesView: emoji reemplaza al dot de color en budget rows, cat chips del filtro, items del listado
- CategoriasModal: botón/input emoji por categoría y en el formulario de nueva categoría
- Migración 007: columna `icono text` en tabla `categorias`
- CSS: `.cat-icon-emoji`, `.cat-emoji-btn`, `.cat-emoji-input`, `.cat-chip-emoji`, etc.

### UX — Hero card y vista anual
- Delta balance vs mes anterior (▲/▼ comparado con mes previo)
- Mini barra de progreso en cada celda del resumen anual (gasto/ingreso ratio)
- Notificación info-toast cuando la pareja añade un movimiento (realtime)
- Copia de presupuesto: toast con número exacto de categorías copiadas

### UX — CSS global
- `.toast-info` (azul accent)
- `.ctx-menu`, `.ctx-backdrop`, `.ctx-item` (menú contextual)
- `.search-highlight` (mark para texto buscado)
- `.today-vs-avg` (indicador hoy vs media)
- `.year-cell-bar`, `.year-cell-bar-fill`, `.year-cell-bar-over`
- `.cat-chips-grid`, `.cat-grid-chip*` (grid de categorías en modal)

---

## Bitácora de sesiones

### 2026-06-11 (esta sesión)
Aplicados los 25 sprints del backlog (ver "Sprints aplicados" arriba). Build verificado. Quedan: migraciones SQL 005–013 en Supabase + push (Ángel).

### 2026-06-10
Ver sección "Mejoras implementadas" arriba.

### Sesiones anteriores
- Migración 005: presupuestos por subcategoría
- Migración 006: frecuencia en plantillas fijas (bimestral/trimestral/semestral/anual)
- Migración 007: campo emoji en categorías
- Sort bidireccional en movimientos (fecha y importe)
- Flow de ingresos pendientes/cobrados
- "Guardar y otro" en modal
- Fix bug: income pendiente nunca se guardaba

---

## Decisiones vigentes

- La BD no se modifica para traducciones: `trCat()` traduce solo en vista
- Grid de chips de categoría en modal: threshold en 12 (>12 vuelve a select)
- Running balance: solo visible cuando no hay filtros activos y sort es por fecha
- Longpress duration: 450ms (vibración de confirmación)

---

## Siguiente paso

1. Ángel aplica las migraciones en orden: 005 → 006 → 007 → 008 → 009 → 010 → 011 → 012 → 013
2. Ángel hace push del código acumulado
3. Aplicar mejoras del backlog por sprints:

   **Sprint A** (bugs, riesgo cero, ~10 min): X1, A2, W2, B6, A8
   **Sprint B** (schema listo, ~30 min): Z1 (actividades clicables), Z2+Z3+Z8 (forms ahorro)
   **Sprint C** (quick wins, ~30 min): D3, D1, A4, A5, C1, C2, C3, C4, V4
   **Sprint D** (contenido, ~15 min): B1, B2, I1 (keys i18n)
   **Sprint E** (a11y + BD, ~25 min): P1, P4, P2+P3 (7 modales), migración 010
   **Sprint KB** (atajos + limpieza, ~5 min): KB3 (atajo 'a'), O3 (npm uninstall react-router-dom)
   **Sprint CSV** (bugs import, ~20 min): CSV5, CSV6, A3, A6

---

## Sprint U7 — Código listo para aplicar (meta ahorro compartida, ~15 min)

> Requiere migración 012 aplicada en Supabase. Confirmar con "aplica Sprint U7".
> **Impacto:** la meta de ahorro mensual deja de estar solo en el dispositivo A y pasa a ser compartida entre los dos miembros de la pareja en tiempo real.

### U7-1 · AhorroSection.jsx — 3 cambios

**Cambio 1** — Sustituir `useEffect` localStorage + `saveMeta` por versión async con DB (líneas 39-53):

```
old:
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

new:
  async function saveMeta(val) {
    const n = parseFloat(String(val).replace(',', '.'))
    const newVal = (!isNaN(n) && n > 0) ? n : null
    setMetaMensual(newVal)
    setEditingMeta(false)
    const { error } = await supabase.from('hogares').update({ meta_ahorro: newVal }).eq('id', hogarId)
    if (error) { showToast?.(lang === 'es' ? 'Error al guardar la meta' : 'Error saving goal', 'error'); load() }
  }
```

**Cambio 2** — En `load()`, añadir fetch de `hogares.meta_ahorro` al `Promise.all` (líneas 65-72):

```
old:
      const [apRes, objRes] = await Promise.all([
        supabase.from('ahorro_aportes').select('*').eq('hogar_id', hogarId).order('fecha', { ascending: false }),
        supabase.from('objetivos').select('*').eq('hogar_id', hogarId).eq('activo', true).order('orden').order('creado_en'),
      ])
      if (apRes.error || objRes.error) { setAvailable(false); return }
      setAportes(apRes.data ?? [])
      setObjetivos(objRes.data ?? [])
      setAvailable(true)

new:
      const [apRes, objRes, hogRes] = await Promise.all([
        supabase.from('ahorro_aportes').select('*').eq('hogar_id', hogarId).order('fecha', { ascending: false }),
        supabase.from('objetivos').select('*').eq('hogar_id', hogarId).eq('activo', true).order('orden').order('creado_en'),
        supabase.from('hogares').select('meta_ahorro').eq('id', hogarId).single(),
      ])
      if (apRes.error || objRes.error) { setAvailable(false); return }
      setAportes(apRes.data ?? [])
      setObjetivos(objRes.data ?? [])
      if (!hogRes.error) setMetaMensual(hogRes.data?.meta_ahorro ?? null)
      setAvailable(true)
```

**Cambio 3** — Añadir suscripción RT a `hogares` para propagar cambio entre parejas (línea 81-86):

```
old:
    const channel = supabase
      .channel(`ahorro-rt-${hogarId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ahorro_aportes', filter: `hogar_id=eq.${hogarId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objetivos', filter: `hogar_id=eq.${hogarId}` }, () => load())
      .subscribe()

new:
    const channel = supabase
      .channel(`ahorro-rt-${hogarId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ahorro_aportes', filter: `hogar_id=eq.${hogarId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objetivos', filter: `hogar_id=eq.${hogarId}` }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hogares', filter: `id=eq.${hogarId}` }, () => load())
      .subscribe()
```

**Notas de este sprint:**
- Migración necesaria: `012_meta_ahorro.sql` (ya generada). Sin ella, `hogRes.error` es truthy y la app funciona como antes (sin meta).
- Retrocompatibilidad: si alguien tenía meta en localStorage, la primera vez que editen la meta se guarda en BD. No hay migración de datos localStorage → BD necesaria porque la meta es fácil de reintroducir.
- RLS: `hogares_update` ya cubre `meta_ahorro` vía `mi_hogar()` — sin cambios en BD además de la migración.

---

## Sprint V1 — Código listo para aplicar (nota del mes localStorage → BD compartida, ~15 min)

> Requiere migración 011 (`notas_mes`) aplicada en Supabase. Confirmar con "aplica Sprint V1".
> **Impacto:** la nota del mes ya tiene UI completa — solo necesita conectarse a la BD para ser compartida entre los dos miembros de la pareja en tiempo real.

### V1-1 · MesView.jsx — 3 cambios

**Cambio 1** — Sustituir `monthNoteKey` + localStorage `useEffect` + `saveMonthNote` sincróno por versión BD (líneas 274-289):

```
old:
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

new:
  const [monthNote, setMonthNote] = useState('')
  const [editingNote, setEditingNote] = useState(false)
  useEffect(() => {
    if (!hogarId) return
    setEditingNote(false)
    supabase.from('notas_mes').select('texto').eq('hogar_id', hogarId).eq('anio', anio).eq('mes', mes).maybeSingle()
      .then(({ data }) => setMonthNote(data?.texto ?? ''))
  }, [hogarId, anio, mes])
  useEffect(() => {
    if (!hogarId) return
    const ch = supabase.channel(`nota-rt-${hogarId}-${anio}-${mes}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notas_mes', filter: `hogar_id=eq.${hogarId}` },
        () => supabase.from('notas_mes').select('texto').eq('hogar_id', hogarId).eq('anio', anio).eq('mes', mes).maybeSingle()
          .then(({ data }) => setMonthNote(data?.texto ?? '')))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [hogarId, anio, mes])
  async function saveMonthNote(val) {
    const v = val.trim()
    setMonthNote(v)
    setEditingNote(false)
    if (v) {
      await supabase.from('notas_mes').upsert(
        { hogar_id: hogarId, anio, mes, texto: v, actualizado_en: new Date().toISOString() },
        { onConflict: 'hogar_id,anio,mes' }
      )
    } else {
      await supabase.from('notas_mes').delete().eq('hogar_id', hogarId).eq('anio', anio).eq('mes', mes)
    }
  }
```

**Cambio 2** — Línea 1704: reemplazar guard `!monthNoteKey` → `!hogarId`:

```
old: if (!hasData && daysLeft <= 0 && !monthNoteKey) return null
new: if (!hasData && daysLeft <= 0 && !hogarId) return null
```

**Cambio 3** — Línea 1736: reemplazar guard `monthNoteKey` → `hogarId`:

```
old: {monthNoteKey && !editingNote && (
new: {hogarId && !editingNote && (
```

**Notas:**
- Sin migración 011, las queries a `notas_mes` devuelven error silencioso → `setMonthNote('')` → UI muestra botón `+ Nota` como antes, sin romper nada.
- RT en canal propio para que se destruya correctamente al cambiar de mes.
- `saveMonthNote` es optimista: actualiza el estado antes del await.

---

## Sprint GR — Código listo para aplicar (gráficas: categoría top € + hoy en calendario, ~10 min)

> Sin SQL. Confirmar con "aplica Sprint GR".
> **Impacto:** GR1 cambia la tarjeta "Categoría frecuente" para mostrar el mayor gasto real en €; GR2 marca visualmente el día de hoy en el heatmap.

### GR-1 · MesView.jsx — topCatId por importe, no por frecuencia (líneas 1385-1390)

```
old:
    // Most frequent category
    const catFreq = {}
    gastosItems.forEach(m => { if (m.categoria_id) catFreq[m.categoria_id] = (catFreq[m.categoria_id] ?? 0) + 1 })
    const topCatId = Object.entries(catFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    return { biggest, topDay, avgDaily, projectedTotal, topCatId, daysElapsed, daysInMonth }

new:
    // Top category by total amount
    const catAmt = {}
    gastosItems.forEach(m => { if (m.categoria_id) catAmt[m.categoria_id] = (catAmt[m.categoria_id] ?? 0) + Number(m.importe) })
    const topCatId = Object.entries(catAmt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const topCatAmt = topCatId ? catAmt[topCatId] : null
    return { biggest, topDay, avgDaily, projectedTotal, topCatId, topCatAmt, daysElapsed, daysInMonth }
```

### GR-2 · GraficasMes.jsx — destructuring + label de InsightsBlock (líneas 185, 231-232)

```
old (línea 185):
  const { biggest, topDay, avgDaily, projectedTotal, topCatId } = insights

new:
  const { biggest, topDay, avgDaily, projectedTotal, topCatId, topCatAmt } = insights
```

```
old (líneas 227-232):
      {topCatName && (
        <div className="insight-card">
          <span className="insight-title">{lang === 'es' ? 'Categoría frecuente' : 'Most used category'}</span>
          <span className="insight-val insight-val-sm">{topCatName}</span>
          <span className="insight-label">{lang === 'es' ? 'más movimientos' : 'most transactions'}</span>
        </div>
      )}

new:
      {topCatName && (
        <div className="insight-card">
          <span className="insight-title">{lang === 'es' ? 'Mayor categoría' : 'Top category'}</span>
          <span className="insight-val insight-val-sm">{topCatName}</span>
          <span className="insight-label">{topCatAmt ? fmt(Math.round(topCatAmt)) : (lang === 'es' ? 'en gastos' : 'in expenses')}</span>
        </div>
      )}
```

### GR-3 · GraficasMes.jsx — hoy marcado en SpendingCalendar (líneas 238, 262, 266)

```
// Añadir justo después de línea 244 (const DOW = ...):
  const todayStr = new Date().toISOString().slice(0, 10)

// Cambiar línea 266:
old: className={`spend-cal-day heat-${heat}${sel ? ' spend-cal-sel' : ''}`}
new: className={`spend-cal-day heat-${heat}${sel ? ' spend-cal-sel' : ''}${cell.dateStr === todayStr ? ' spend-cal-today' : ''}`}
```

### GR-4 · App.css — clase `.spend-cal-today` (añadir después de línea 1850)

```css
.spend-cal-today { outline: 1.5px solid var(--text3); outline-offset: -1px; }
```

> Usa `outline` (no `border`) para no interferir con `.spend-cal-sel` que ya usa `border-color !important`.

---

## Sprint T2 — Código listo para aplicar (BusquedaGlobal: resumen de patrones, ~10 min)

> Sin SQL. Confirmar con "aplica Sprint T2".
> **Impacto:** cuando la búsqueda devuelve el mismo concepto 3+ veces, muestra un resumen compacto "Netflix · 6× · 95.94€" antes de la lista completa. Muy útil para detectar suscripciones o gastos recurrentes.

### T2-1 · BusquedaGlobal.jsx — bloque de patrones antes de la lista (línea 98, dentro del bloque `results.length > 0`)

```
old (línea 98-99):
        {!searching && results && results.length > 0 && (
          <div className="global-search-results">

new:
        {!searching && results && results.length > 0 && (() => {
          const patterns = Object.values(
            results.reduce((acc, m) => {
              const key = (m.concepto || '').toLowerCase()
              if (!key) return acc
              if (!acc[key]) acc[key] = { concepto: m.concepto, count: 0, total: 0, tipo: m.tipo }
              acc[key].count++; acc[key].total += Number(m.importe)
              return acc
            }, {})
          ).filter(p => p.count >= 3).sort((a, b) => b.total - a.total)
          return (
            <>
              {patterns.length > 0 && (
                <div className="gs-patterns">
                  <p className="gs-patterns-title">{es ? 'Recurrentes' : 'Patterns'}</p>
                  {patterns.map(p => (
                    <div key={p.concepto} className="gs-pattern-row">
                      <span className="gs-pattern-concept">{p.concepto}</span>
                      <span className="gs-pattern-meta">{p.count}× · {fmt(p.total)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="global-search-results">
```

```
// Y cerrar el nuevo IIFE al final de la sección (reemplazar la línea de cierre del div + paréntesis):
old (líneas 131-132):
          </div>
        )}

new:
              </div>
            </>
          )
        })()}
```

### T2-2 · App.css — estilos para `.gs-patterns`

```css
.gs-patterns { padding: 8px 12px 4px; border-bottom: 1px solid var(--border); }
.gs-patterns-title { font-size: 0.68rem; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: .04em; margin: 0 0 4px; }
.gs-pattern-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 0.82rem; }
.gs-pattern-concept { color: var(--text); font-weight: 500; }
.gs-pattern-meta { color: var(--text3); font-size: 0.78rem; }
```

---

## Sprint GUIDE — Código listo para aplicar (GuiaModal: 2 tips nuevos, ~5 min)

> Sin SQL. Confirmar con "aplica Sprint GUIDE".
> **Impacto:** la guía de uso ya tiene 7 tips pero no menciona la vista anual, el panel de actividad ni la copia de seguridad. Añadir 2 tips mejora el descubrimiento de features clave sin sobrecargar la guía.

### GUIDE-1 · GuiaModal.jsx — añadir 2 items al array (tras el item 7 de cada versión)

```
// Añadir al final del array `items` en la versión ES (después del item de 📱 Lleváosla en el móvil):
    ['📆', 'Vista del año de un vistazo', 'Desplegad "Año" (botón arriba a la derecha) para ver todos los meses: ingresos, gastos y si estuvisteis dentro del presupuesto. Ideal para la revisión trimestral.'],
    ['🔔', 'Actividad de vuestra pareja', 'El icono 🕐 muestra qué ha apuntado tu pareja en tiempo real. También podéis añadir una nota al mes ("Vacaciones", "Mes caro") para recordar el contexto.'],

// Añadir al final del array EN (después del item de 📱 Take it on your phone):
    ['📆', 'Year at a glance', 'Expand "Year" (top-right button) to see all months: income, expenses and whether you stayed within budget. Great for a quarterly review.'],
    ['🔔', 'Partner activity', 'The 🕐 icon shows what your partner has logged in real time. You can also add a month note ("Holiday", "Expensive month") to remember the context.'],
```

Nota: la guía pasa de 7 a 9 items. Ningún otro cambio es necesario en el componente.

---

## Sprint RESTORE — Código listo para aplicar (restaurar backup JSON, ~20 min)

> Sin SQL. Confirmar con "aplica Sprint RESTORE".
> **Impacto:** el backup ya descarga un JSON completo, pero no hay forma de importarlo de vuelta. Sprint RESTORE añade "Restaurar backup" en la sección Datos: lee el JSON, valida el hogar, muestra un preview y hace UPSERT idempotente (no borra nada, es retrocompatible).

### RESTORE-1 · MesView.jsx — 3 cambios

**Cambio 1** — Añadir `restoreFileRef` a las refs del componente (después de línea 67 `const monthPickerRef`):

```
// Añadir después de la línea 67:
  const restoreFileRef = useRef(null)
```

**Cambio 2** — Añadir función `handleRestore` después de `handleBackup` (después de línea 1104 `}`):

```js
  async function handleRestore(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      if (!backup.version || !backup.hogar_id) {
        showToast(lang === 'es' ? 'Archivo no válido' : 'Invalid backup file', 'error')
        return
      }
      if (backup.hogar_id !== hogarId) {
        showToast(lang === 'es' ? 'Este backup es de otro hogar' : 'Backup belongs to a different household', 'error')
        return
      }
      const movCount = backup.movimientos?.length ?? 0
      const presCount = backup.presupuestos?.length ?? 0
      const exportDate = backup.exportado_en?.slice(0, 10) ?? '?'
      const ok = window.confirm(
        lang === 'es'
          ? `¿Restaurar backup del ${exportDate}?\n• ${movCount} movimientos\n• ${presCount} presupuestos\n\nSe añadirán/actualizarán los datos existentes. No se borrará nada.`
          : `Restore backup from ${exportDate}?\n• ${movCount} movements\n• ${presCount} budgets\n\nExisting data will be added/updated. Nothing will be deleted.`
      )
      if (!ok) return
      showToast(lang === 'es' ? 'Restaurando…' : 'Restoring…')
      const tables = ['movimientos', 'presupuestos', 'plantillas_fijas', 'objetivos', 'ahorro_aportes', 'presupuestos_subcat']
      let restored = 0
      for (const tb of tables) {
        if (!backup[tb]?.length) continue
        const rows = backup[tb].map(r => ({ ...r, hogar_id: hogarId }))
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await supabase.from(tb).upsert(rows.slice(i, i + 500), { onConflict: 'id' })
          if (error) throw error
          restored += Math.min(500, rows.length - i)
        }
      }
      loadMesRef.current?.()
      showToast(lang === 'es' ? `Restaurados ${restored} registros ✓` : `Restored ${restored} records ✓`)
    } catch {
      showToast(lang === 'es' ? 'Error al restaurar' : 'Error restoring backup', 'error')
    }
  }
```

**Cambio 3** — Añadir botón "Restaurar backup" + input oculto en section-datos (después del botón backup, línea 2996):

```
old:
                >
                  ⬇ {lang === 'es' ? 'Copia de seguridad' : 'Backup'}
                </button>
              </div>
            </section>

new:
                >
                  ⬇ {lang === 'es' ? 'Copia de seguridad' : 'Backup'}
                </button>
                <button
                  className="tool-chip"
                  onClick={() => restoreFileRef.current?.click()}
                  title={lang === 'es'
                    ? 'Restaurar datos desde un archivo de backup JSON descargado anteriormente'
                    : 'Restore data from a previously downloaded JSON backup file'}
                >
                  ⤴ {lang === 'es' ? 'Restaurar backup' : 'Restore backup'}
                </button>
                <input
                  ref={restoreFileRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={handleRestore}
                />
              </div>
            </section>
```

**Notas del sprint:**
- UPSERT con `onConflict: 'id'`: si el ID ya existe en la BD se actualiza; si no, se inserta. Idempotente — aplicar el mismo backup dos veces es seguro.
- `hogar_id: hogarId` forzado en cada fila para garantizar que los datos pertenecen al hogar actual.
- Categorías y subcategorías NO se restauran (ya tienen las predeterminadas de la migración 009 y sus IDs son uuids que podrían diferir).
- Batches de 500 para no exceder el límite de payload de Supabase (1 MB aprox).
- `notas_mes` no está en el backup original — si se añade al backup en el futuro, basta añadir `'notas_mes'` al array `tables`.

---

## Sprint X — Código listo para aplicar (insights delta + presupuesto en vista anual, ~20 min)

> Sin SQL. Confirmar con "aplica Sprint X".
> **Impacto:** X3 añade una tarjeta "vs mes ant." en el bloque de insights de gráficas; W3 muestra si cada mes estuvo dentro o sobre presupuesto en la vista anual.
> **Nota:** aplicar Sprint GR antes de Sprint X (ambos modifican `spendingInsights`).

### X-1 · MesView.jsx — X3 + W3

**Cambio 1 — X3** — `spendingInsights` useMemo: añadir delta vs mes anterior (líneas 1385-1390).
Si Sprint GR ya fue aplicado, este es el estado previo de esas líneas tras GR:

```
old (tras aplicar GR1):
    // Top category by total amount
    const catAmt = {}
    gastosItems.forEach(m => { if (m.categoria_id) catAmt[m.categoria_id] = (catAmt[m.categoria_id] ?? 0) + Number(m.importe) })
    const topCatId = Object.entries(catAmt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const topCatAmt = topCatId ? catAmt[topCatId] : null
    return { biggest, topDay, avgDaily, projectedTotal, topCatId, topCatAmt, daysElapsed, daysInMonth }
  }, [gastosItems])

new:
    // Top category by total amount
    const catAmt = {}
    gastosItems.forEach(m => { if (m.categoria_id) catAmt[m.categoria_id] = (catAmt[m.categoria_id] ?? 0) + Number(m.importe) })
    const topCatId = Object.entries(catAmt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const topCatAmt = topCatId ? catAmt[topCatId] : null
    // Delta vs previous month
    const deltaGastosMes = prevTotals?.gastos > 0
      ? Math.round((totalGastosAll - prevTotals.gastos) / prevTotals.gastos * 100)
      : null
    return { biggest, topDay, avgDaily, projectedTotal, topCatId, topCatAmt, deltaGastosMes, daysElapsed, daysInMonth }
  }, [gastosItems, prevTotals])
```

Si Sprint GR NO fue aplicado, buscar `return { biggest, topDay, avgDaily, projectedTotal, topCatId, daysElapsed, daysInMonth }` y aplicar ambos cambios juntos.

**Cambio 2 — W3** — `loadYearData` useCallback: añadir fetch de `presupuestos` (líneas 449-464):

```
old:
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

new:
      const [movRes, budgRes] = await Promise.all([
        supabase.from('movimientos').select('tipo, importe, mes').eq('hogar_id', hogarId).eq('anio', anio),
        supabase.from('presupuestos').select('mes, importe').eq('hogar_id', hogarId).eq('anio', anio),
      ])
      if (!movRes.data) return
      const byMonth = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, income: 0, expenses: 0, budget: 0 }))
      movRes.data.forEach(m => {
        const idx = m.mes - 1
        if (byMonth[idx]) {
          if (m.tipo === 'ingreso') byMonth[idx].income += Number(m.importe)
          else byMonth[idx].expenses += Number(m.importe)
        }
      })
      if (budgRes.data) {
        budgRes.data.forEach(b => { if (byMonth[b.mes - 1]) byMonth[b.mes - 1].budget += Number(b.importe) })
      }
      setYearData(byMonth)
```

**Cambio 3 — W3** — Indicador de presupuesto en cada celda del año (añadir después de `year-cell-bar` div, línea ~2962):

```
// Añadir después de la barra de progreso (cierre del bloque `{d.income > 0 && ...}`):
                                  {d.budget > 0 && !isFutureCell && (
                                    <span
                                      className={`year-cell-budget-dot ${d.expenses > d.budget ? 'year-budget-over' : 'year-budget-ok'}`}
                                      title={`${lang === 'es' ? 'Presupuesto' : 'Budget'}: ${fmtK(d.budget)}`}
                                    >
                                      {d.expenses > d.budget ? '▲' : '✓'}
                                    </span>
                                  )}
```

### X-2 · GraficasMes.jsx — X3: tarjeta delta en InsightsBlock

```
// Cambio en destructuring (línea 185), añadir deltaGastosMes:
old:  const { biggest, topDay, avgDaily, projectedTotal, topCatId, topCatAmt } = insights
new:  const { biggest, topDay, avgDaily, projectedTotal, topCatId, topCatAmt, deltaGastosMes } = insights

// Añadir nueva tarjeta después del bloque topCatName (después línea 234):
      {deltaGastosMes !== null && (
        <div className="insight-card">
          <span className="insight-title">{lang === 'es' ? 'vs mes anterior' : 'vs last month'}</span>
          <span className={`insight-val ${deltaGastosMes >= 0 ? 'delta-neg' : 'delta-pos'}`}>
            {deltaGastosMes >= 0 ? '+' : ''}{deltaGastosMes}%
          </span>
          <span className="insight-label">
            {deltaGastosMes >= 0
              ? (lang === 'es' ? 'más gasto' : 'more spent')
              : (lang === 'es' ? 'menos gasto' : 'less spent')}
          </span>
        </div>
      )}
```

### X-3 · App.css — indicadores de presupuesto en vista anual

```css
/* Añadir después de .year-cell-bar styles: */
.year-cell-budget-dot { font-size: 0.48rem; line-height: 1; }
.year-budget-ok { color: var(--delta-pos); }
.year-budget-over { color: var(--delta-neg); }
```

**Notas del sprint:**
- X3: `deltaGastosMes` se calcula con `totalGastosAll` (sin pendientes). El color es inverso: `+` en rojo (más gasto = peor), `-` en verde (menos gasto = mejor), usando las clases `delta-neg`/`delta-pos` ya existentes.
- W3: si ningún mes tiene presupuesto, `budget = 0` y el indicador no se muestra — retrocompatible.
- W3: el fetch paralelo añade ~50ms de latencia al abrir la vista anual (presupuestos tiene índice en `hogar_id`).

---

## Sprint P — Código listo para aplicar (plantillas: método pago + ingresos + preview presupuesto, ~25 min)

> Requiere migración 013 (`plantillas_mejoras`) aplicada en Supabase. Confirmar con "aplica Sprint P".
> **Impacto:** las plantillas recurrentes pasan a soportar método de pago y tipo ingreso; el botón "sugerir presupuesto" muestra preview antes de crear.

### P-1 · PlantillasModal.jsx — Z4 + D2 (método de pago y tipo ingreso/gasto)

**Cambio 1** — Nuevos estados para el formulario de nueva plantilla (añadir después de línea 21 `useState('mensual')`):

```
// añadir líneas 22-23:
  const [newTipo, setNewTipo] = useState('gasto')
  const [newMetodoPago, setNewMetodoPago] = useState('tarjeta')
```

**Cambio 2** — `handleAdd` (línea 65-78): añadir `tipo` y `metodo_pago` al insert:

```
old:
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

new:
      const { error } = await supabase.from('plantillas_fijas').insert({
        hogar_id: hogarId,
        nombre: newNombre.trim(),
        importe: imp,
        tipo: newTipo,
        categoria_id: newCatId || null,
        subcategoria_id: newSubcatId || null,
        metodo_pago: newMetodoPago,
        dia_mes: newDia,
        nota: newNota.trim() || null,
        activa: true,
        orden: maxOrden + 1,
        frecuencia: newFrecuencia,
        mes_inicio: newMesInicio,
      })
```

**Cambio 3** — Reset del formulario tras crear (línea 79-81): añadir reset de nuevos campos:

```
old:
      setNewNombre(''); setNewImporte(''); setNewCatId('')
      setNewSubcatId(''); setNewDia(1); setNewNota('')
      setNewFrecuencia('mensual'); setNewMesInicio(new Date().getMonth() + 1)

new:
      setNewNombre(''); setNewImporte(''); setNewCatId('')
      setNewSubcatId(''); setNewDia(1); setNewNota('')
      setNewFrecuencia('mensual'); setNewMesInicio(new Date().getMonth() + 1)
      setNewTipo('gasto'); setNewMetodoPago('tarjeta')
```

**Cambio 4** — `startEdit` (líneas 112-124): añadir `tipo` y `metodo_pago` a editData:

```
old:
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

new:
  function startEdit(p) {
    setEditingId(p.id)
    setEditData({
      nombre: p.nombre,
      importe: String(p.importe),
      tipo: p.tipo ?? 'gasto',
      categoria_id: p.categoria_id ?? '',
      subcategoria_id: p.subcategoria_id ?? '',
      metodo_pago: p.metodo_pago ?? 'tarjeta',
      dia_mes: p.dia_mes ?? 1,
      nota: p.nota ?? '',
      frecuencia: p.frecuencia ?? 'mensual',
      mes_inicio: p.mes_inicio ?? 1,
    })
  }
```

**Cambio 5** — `handleSaveEdit` (líneas 131-140): añadir `tipo` y `metodo_pago` al update:

```
old:
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

new:
      await supabase.from('plantillas_fijas').update({
        nombre: editData.nombre.trim(),
        importe: imp,
        tipo: editData.tipo ?? 'gasto',
        categoria_id: editData.categoria_id || null,
        subcategoria_id: editData.subcategoria_id || null,
        metodo_pago: editData.metodo_pago ?? 'tarjeta',
        dia_mes: editData.dia_mes,
        nota: editData.nota.trim() || null,
        frecuencia: editData.frecuencia,
        mes_inicio: editData.mes_inicio,
      }).eq('id', id)
```

**Cambio 6** — Línea 51: filtrado de categorías dinámico según tipo:

```
old:
  const catsFiltradas = categorias.filter(c => c.tipo === 'gasto')

new:
  const catsFiltradas = categorias.filter(c => c.tipo === newTipo)
  const editCatsFiltradas = categorias.filter(c => c.tipo === (editData.tipo ?? 'gasto'))
```

**Cambio 7** — Título y descripción (líneas 170-178): actualizar a "Plantillas recurrentes":

```
old (línea 170):
            {lang === 'es' ? 'Gastos fijos recurrentes' : 'Recurring fixed expenses'}
new:
            {lang === 'es' ? 'Plantillas recurrentes' : 'Recurring templates'}
```

```
old (líneas 176-179):
            ? 'Define tus gastos recurrentes. Úsalos para generar los gastos de cualquier mes con un clic.'
            : 'Define your recurring expenses. Use them to populate any month with one click.'
new:
            ? 'Define tus gastos e ingresos recurrentes. Úsalos para generar movimientos de cualquier mes con un clic.'
            : 'Define your recurring expenses and income. Use them to populate any month with one click.'
```

**Cambio 8** — Vista de lectura (después de línea 304 `{p.nota && ...}`): mostrar metodo_pago y tipo ingreso:

```
// Añadir después de `{p.nota && <span className="plantilla-nota">{p.nota}</span>}`:
                      {(p.metodo_pago && p.metodo_pago !== 'tarjeta') && (
                        <span className="plantilla-nota">{p.metodo_pago}</span>
                      )}
                      {p.tipo === 'ingreso' && (
                        <span className="plantilla-freq-badge plantilla-freq-badge-income">
                          {lang === 'es' ? 'ingreso' : 'income'}
                        </span>
                      )}
```

**Cambio 9** — Formulario de edición (en `plantilla-edit-row` que tiene nota, después de línea 273 `</input>`): añadir selectores tipo y metodo_pago:

```
// Añadir al final de la plantilla-edit-row que tiene nota y categoría (después del input nota, línea 274):
                    <select className="plantilla-edit-select" value={editData.tipo ?? 'gasto'}
                      onChange={e => setEditData(d => ({ ...d, tipo: e.target.value, categoria_id: '', subcategoria_id: '' }))}>
                      <option value="gasto">{lang === 'es' ? 'Gasto' : 'Expense'}</option>
                      <option value="ingreso">{lang === 'es' ? 'Ingreso' : 'Income'}</option>
                    </select>
                    <select className="plantilla-edit-select" value={editData.metodo_pago ?? 'tarjeta'}
                      onChange={e => setEditData(d => ({ ...d, metodo_pago: e.target.value }))}>
                      <option value="tarjeta">{lang === 'es' ? 'Tarjeta' : 'Card'}</option>
                      <option value="efectivo">{lang === 'es' ? 'Efectivo' : 'Cash'}</option>
                      <option value="transferencia">{lang === 'es' ? 'Transferencia' : 'Transfer'}</option>
                      <option value="bizum">Bizum</option>
                    </select>
```

Nota: también cambiar la línea 254 que usa `catsFiltradas` en el edit form para usar `editCatsFiltradas`:
```
old (línea 254): {catsFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
new:             {editCatsFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
```

**Cambio 10** — Formulario de nueva plantilla (después del input nota, línea 422): añadir selectores tipo y metodo_pago:

```
// Añadir entre el input nota (línea 422) y el button submit (línea 424):
              <select className="plantilla-edit-select" value={newTipo}
                onChange={e => { setNewTipo(e.target.value); setNewCatId(''); setNewSubcatId('') }}>
                <option value="gasto">{lang === 'es' ? 'Gasto' : 'Expense'}</option>
                <option value="ingreso">{lang === 'es' ? 'Ingreso' : 'Income'}</option>
              </select>
              <select className="plantilla-edit-select" value={newMetodoPago}
                onChange={e => setNewMetodoPago(e.target.value)}>
                <option value="tarjeta">{lang === 'es' ? 'Tarjeta' : 'Card'}</option>
                <option value="efectivo">{lang === 'es' ? 'Efectivo' : 'Cash'}</option>
                <option value="transferencia">{lang === 'es' ? 'Transferencia' : 'Transfer'}</option>
                <option value="bizum">Bizum</option>
              </select>
```

### P-2 · MesView.jsx — W5 (preview antes de "sugerir presupuesto desde media")

Líneas 925-928 en `handleSuggestBudgets`:

```
old:
      const ok = window.confirm(lang === 'es'
        ? `¿Crear ${rows.length} presupuesto(s) con la media de los últimos 3 meses? Podrás ajustarlos después.`
        : `Create ${rows.length} budget(s) from the last 3 months' average? You can adjust them later.`)

new:
      const preview = rows.slice(0, 5).map(r => {
        const nombre = categorias.find(c => c.id === r.categoria_id)?.nombre ?? '?'
        return `• ${nombre}: ${r.importe}€`
      }).join('\n')
      const extra = rows.length > 5 ? `\n…y ${rows.length - 5} más` : ''
      const ok = window.confirm(lang === 'es'
        ? `¿Crear ${rows.length} presupuesto(s) con la media de los últimos 3 meses?\n\n${preview}${extra}\n\nPodrás ajustarlos después.`
        : `Create ${rows.length} budget(s) from the last 3 months' average?\n\n${preview}${extra}\n\nYou can adjust them later.`)
```

### P-3 · App.css — clase `.plantilla-freq-badge-income`

```css
// Añadir después de la clase .plantilla-freq-badge-nonmonthly:
.plantilla-freq-badge-income { background: color-mix(in srgb, var(--delta-pos) 15%, var(--surface)); color: var(--delta-pos); }
```

**Notas del sprint:**
- Sin migración 013, las columnas `tipo` y `metodo_pago` no existen → el insert falla silenciosamente con error Supabase. Aplicar 013 antes de este sprint.
- Las plantillas existentes ya tienen `tipo='gasto'` y `metodo_pago='tarjeta'` por los valores DEFAULT de la migración → retrocompatibilidad total.
- `editCatsFiltradas` necesita reemplazar `catsFiltradas` en la línea 254 del form de edición (donde se listan las categorías disponibles al editar).

---

## Sprint D — Código listo para aplicar (contenido y traducciones, ~20 min)

> Confirmar con "aplica Sprint D" para que Claude ejecute los cambios de una vez.

### D-1: B1 — Traducciones EN faltantes para categorías de migración 009 (`catNames.js`)

Añadir en el objeto `ES_EN` antes del cierre `}` (línea 151):

```js
  // ── Categorías completas de migración 009 (faltan en ES_EN) ──
  'ocio y entretenimiento': 'Entertainment',
  'ropa y calzado': 'Clothing & Footwear',
  'cuidado personal': 'Personal care',
  'gastos inesperados': 'Unexpected expenses',
  'gastos extra programados': 'Scheduled extras',
  'educación y formación': 'Education & Training',
  'trabajo y negocio': 'Work & Business',
  // ── Subcategorías de migración 009 ──
  'médico / dentista': 'Doctor / Dentist',
  'salidas y bares': 'Bars & Outings',
  'cine / espectáculos': 'Cinema / Shows',
  'libros y cultura': 'Books & Culture',
  'streaming (netflix, etc.)': 'Streaming (Netflix, etc.)',
  'música (spotify, etc.)': 'Music (Spotify, etc.)',
  'apps y software': 'Apps & Software',
  'almacenamiento en la nube': 'Cloud storage',
  'periódicos y revistas': 'Newspapers & Magazines',
  'cosmética y cuidado': 'Beauty & Care',
  'depilación / estética': 'Hair removal / Aesthetics',
  'multas': 'Fines',
  'médico urgente': 'Emergency medical',
  'vacaciones': 'Holidays',
  'navidad': 'Christmas',
```

### D-2: B2 — Sugerencias de conceptos para categorías nuevas (`conceptos.js`)

Añadir en el objeto `CONCEPTOS` antes del cierre `}` (línea 22):

```js
  'ropa y calzado': ['Ropa nueva', 'Calzado/Zapatos', 'Ropa interior', 'Accesorios', 'Ropa niños', 'Temporada'],
  'suscripciones':  ['Netflix', 'Spotify', 'Amazon Prime', 'HBO Max', 'YouTube Premium', 'iCloud', 'Office 365'],
  'cuidado personal': ['Peluquería/Barbería', 'Cosmética', 'Perfume', 'Depilación', 'Spa/Masaje'],
  'gastos extra programados': ['Viaje verano', 'Navidad', 'Cumpleaños', 'Regalos programados', 'Revisión coche anual'],
  'trabajo y negocio': ['Material oficina', 'Formación profesional', 'Software/Herramientas', 'Desplazamiento trabajo'],
```

### D-3: I1 — Keys i18n faltantes para features de los sprints (`i18n.js`)

Añadir antes del `},` de cierre en ES (línea 128) y EN (línea 255):

```js
// ES — insertar en línea 127 (antes del `,` de cierre del bloque es):
day_ago: 'd',       // ya existe — verificar que no se duplique
dark_mode: 'Modo oscuro', light_mode: 'Modo claro', auto_mode: 'Modo auto',
cash: 'Efectivo', deposit: '+ Aportar', withdraw: '− Retirar',
monthly_goal: 'Meta mensual de ahorro', deposit_title: 'Añadir a la hucha',
activity_shortcut: 'Panel de actividad',

// EN — insertar en línea 254 (antes del `,` de cierre del bloque en):
dark_mode: 'Dark mode', light_mode: 'Light mode', auto_mode: 'Auto mode',
cash: 'Cash', deposit: '+ Deposit', withdraw: '− Withdraw',
monthly_goal: 'Monthly savings goal', deposit_title: 'Deposit to pot',
activity_shortcut: 'Activity panel',
```

---

## Sprint CSV — Código listo para aplicar (bugs importación, ~25 min)

> Confirmar con "aplica Sprint CSV" para que Claude ejecute los cambios de una vez.

### CSV-1: A3 — Validar que la fecha sea real (`ImportarCSVModal.jsx:70`)

```js
// ANTES (línea 70):
if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) errors.push('fecha')

// DESPUÉS — rechaza fechas como 2024-13-45:
if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || isNaN(Date.parse(fecha))) errors.push('fecha')
```

### CSV-2: CSV6 — Añadir columna `metodo_pago` al mapeo (`ImportarCSVModal.jsx:34-44`)

```js
// Añadir al objeto idx (línea 43, después de nota):
metodo_pago: cols.findIndex(c => ['metodo_pago', 'payment_method', 'metodo', 'pago'].includes(c)),

// Línea ~67 — parsear valor (después de const pendiente):
const metodoPago = (['tarjeta', 'efectivo', 'transferencia', 'bizum'].includes(get('metodo_pago').toLowerCase()))
  ? get('metodo_pago').toLowerCase() : 'tarjeta'

// Línea ~84 — añadir al return:
metodoPago,

// Línea 147 — añadir al objeto insert:
metodo_pago: r.metodoPago,
```

### CSV-3: CSV5 — Subcategoría no se insertaba (`ImportarCSVModal.jsx` + `MesView.jsx`)

El campo `subcategoria` se detecta pero nunca se mapea a ID ni se inserta. Fix en 4 puntos:

```js
// 1. MesView.jsx:3051 — pasar subcategorias al modal:
// ANTES:
categorias={categorias}
// DESPUÉS:
categorias={categorias}
subcategorias={subcategorias}

// 2. ImportarCSVModal.jsx:91 — añadir prop:
// ANTES:
export default function ImportarCSVModal({ open, onClose, lang, hogarId, userId, categorias, anio, mes, onImported }) {
// DESPUÉS:
export default function ImportarCSVModal({ open, onClose, lang, hogarId, userId, categorias, subcategorias = [], anio, mes, onImported }) {

// 3. ImportarCSVModal.jsx:46-48 — añadir lookup de subcategorías (después de catByName):
const subByName = {}
subcategorias.forEach(s => { subByName[s.nombre.toLowerCase()] = s.id })
// (esto debe estar dentro de parseCSV() — pasar subcategorias como parámetro también)

// 4. Cambiar firma de parseCSV (línea 28) y llamada (línea 115):
function parseCSV(text, categorias, subcategorias = []) {
  // ...existing code...
  const subByName = {}
  subcategorias.forEach(s => { subByName[s.nombre.toLowerCase()] = s.id })
  // En el return del map (línea ~84), añadir:
  subcatId: subByName[get('subcategoria').toLowerCase()] ?? null,
  // En el insert (línea 143), añadir:
  subcategoria_id: r.subcatId,

// 5. Línea 115 — actualizar llamada a parseCSV:
const parsed = parseCSV(ev.target.result, categorias, subcategorias)
```

### CSV-4: A6 — Botón "Descargar plantilla CSV" (`ImportarCSVModal.jsx`)

Añadir función y botón para que el usuario descargue un CSV de ejemplo con los campos correctos:

```jsx
// Añadir función dentro del componente (antes del return):
function downloadTemplate() {
  const csv = [
    'fecha,tipo,concepto,importe,categoria,subcategoria,nota,fijo,pendiente,metodo_pago',
    '2024-01-15,gasto,Compra supermercado,85.50,Alimentación,Supermercado,,,,tarjeta',
    '2024-01-16,ingreso,Nómina enero,2000,Nómina,,,,,'
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'plantilla-finanzas.csv'; a.click()
  URL.revokeObjectURL(url)
}

// Añadir botón en el modal junto a "Elegir archivo":
<button type="button" className="btn-sm btn-ghost" onClick={downloadTemplate}>
  ⬇ {lang === 'es' ? 'Descargar plantilla' : 'Download template'}
</button>
```

---

## Sprint KB — Código listo para aplicar (atajos + limpieza, ~5 min)

> Confirmar con "aplica Sprint KB" para que Claude ejecute los 3 cambios de una vez.

### KB-1: KB3 — Atajo `a`/`A` para el panel de actividad (`MesView.jsx:577-598`)

```jsx
// Insertar ANTES de la línea 578 (antes del guard que bloquea todo cuando hay modales):
// DESPUÉS de la línea "if (e.key === 'Escape' && showHelp)..."
if (e.key === 'a' || e.key === 'A') { setShowActivity(v => !v); return }
```

Y añadir en la tabla de atajos (MesView.jsx, después de la fila de 'D' en línea ~3150):
```jsx
['A', lang === 'es' ? 'Panel de actividad' : 'Activity panel'],
```

### KB-2: O3 — Eliminar dependencia sin usar (`package.json`)

```bash
# En terminal, desde /Volumes/AF-Claude-T7/02_Code/finanzas-pareja/:
npm uninstall react-router-dom
```
`react-router-dom` está declarado en `dependencies` pero tiene **cero usos** en el código. Reduce el bundle.

---

## Sprint E — Código listo para aplicar (accesibilidad a11y, ~25 min)

> Confirmar con "aplica Sprint E" para que Claude ejecute los cambios de una vez.
> Todos son cambios de atributos HTML sin lógica — riesgo cero.

### E-1: P1 — `aria-haspopup` en botón ⋯ (`MesView.jsx:1538`)

```jsx
// Añadir aria-haspopup="menu" junto a aria-expanded:
// ANTES:
aria-expanded={showMenu}
// DESPUÉS:
aria-haspopup="menu"
aria-expanded={showMenu}
```

### E-2: P4 — `role="menu"` con label + `role="menuitem"` en items (`MesView.jsx:1546-1567`)

```jsx
// Línea 1546 — añadir aria-label al div del menú:
// ANTES:
<div className="header-menu" role="menu">
// DESPUÉS:
<div className="header-menu" role="menu" aria-label={lang === 'es' ? 'Opciones' : 'Options'}>

// Cada uno de los 6 botones del menú — añadir role="menuitem":
// ANTES:
<button className="header-menu-item" onClick={...}>
// DESPUÉS:
<button className="header-menu-item" role="menuitem" onClick={...}>
```

### E-3: P2 + P3 — `role="dialog"` + `aria-modal` + `aria-labelledby` en 7 modales

**Patrón** (aplicar en cada modal): añadir `role="dialog" aria-modal="true" aria-labelledby="ID"` al `.modal-card`, y `id="ID"` al `<h2>` del título.

| Modal | Archivo:línea card | Archivo:línea h2 | ID sugerido |
|-------|-------------------|-------------------|-------------|
| Movimiento | `MovimientoModal.jsx:199` | `MovimientoModal.jsx:201` | `mov-modal-title` |
| Plantillas | `PlantillasModal.jsx:167` | `PlantillasModal.jsx:169` | `pl-modal-title` |
| Búsqueda | `BusquedaGlobal.jsx:78` | `BusquedaGlobal.jsx:80` | `search-modal-title` |
| Importar CSV | `ImportarCSVModal.jsx:166` | `ImportarCSVModal.jsx:168` | `import-modal-title` |
| Categorías | `CategoriasModal.jsx:181` | `CategoriasModal.jsx:183` | `cats-modal-title` |
| Guía | `GuiaModal.jsx:35` | `GuiaModal.jsx:37` | `guia-modal-title` |
| Atajos | `MesView.jsx:3125` | `MesView.jsx:3127` | `help-modal-title` |

**Ejemplo completo** (MovimientoModal.jsx:199-201):
```jsx
// ANTES:
<div className="modal-card" ref={cardRef}>
  <div className="modal-header">
    <h2 className="modal-title">

// DESPUÉS:
<div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="mov-modal-title" ref={cardRef}>
  <div className="modal-header">
    <h2 id="mov-modal-title" className="modal-title">
```

*(Aplicar el mismo patrón en los otros 6 modales con sus respectivos IDs)*

---

## Sprint C — Código listo para aplicar (quick wins UX, ~30 min)

> Confirmar con "aplica Sprint C" para que Claude ejecute los cambios de una vez.

### C-1: D3 — Dark mode en menú ⋯ (`MesView.jsx:1564`)

```jsx
// Insertar ANTES del botón "Sign out" (línea 1565):
<button className="header-menu-item" onClick={() => { setShowMenu(false); cycleTheme() }}>
  {theme === 'auto' ? '🌙' : theme === 'dark' ? '☀️' : '🔆'}
  {' '}{lang === 'es'
    ? (theme === 'auto' ? 'Modo oscuro' : theme === 'dark' ? 'Modo claro' : 'Modo auto')
    : (theme === 'auto' ? 'Dark mode' : theme === 'dark' ? 'Light mode' : 'Auto mode')}
</button>
```

### C-2: D1 — Chip Efectivo que filtra por metodo_pago (`MesView.jsx`)

6 cambios coordinados:

```jsx
// 1. Línea 61 — nuevo estado (después de filterDate):
const [filtroMetodoPago, setFiltroMetodoPago] = useState(null)

// 2. Línea 1219 — añadir al bloque de filtros en movimientosFiltrados:
.filter(m => !filtroMetodoPago || m.metodo_pago === filtroMetodoPago)

// 3. Línea 374 — reset al cambiar mes (añadir al final):
setFiltroMetodoPago(null)

// 4. Línea 597 — tecla X (añadir al final):
setFiltroMetodoPago(null)

// 5. Línea 1249 — hayFiltroActivo:
const hayFiltroActivo = filtroTipo !== 'all' || busqueda || filtroCatId || filtroFijo !== null
  || filtroPendiente || filterDate || filtroMetodoPago

// 6. Líneas 1720-1729 — chip Efectivo (reemplazar el onClick):
// ANTES:
onClick={() => { setBusqueda(''); setFiltroTipo('all'); movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
// DESPUÉS:
onClick={() => {
  setFiltroMetodoPago(prev => prev === 'efectivo' ? null : 'efectivo')
  setBusqueda('')
  movListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}}
// Y añadir clase activa al chip:
className={`quick-chip quick-chip-btn quick-chip-cash${filtroMetodoPago === 'efectivo' ? ' quick-chip-active' : ''}`}
```

### C-3: A4 — autoFocus inteligente en login (`LoginPage.jsx:41,54`)

```jsx
// Línea 48 — email input: añadir autoFocus si email está vacío:
autoFocus={!email}

// Línea ~60 — password input: añadir autoFocus si email ya está relleno:
autoFocus={!!email}
```

### C-4: A5 — Splash "Loading…" bilingüe (`App.jsx:12`)

```jsx
// ANTES:
return <div className="splash">Loading…</div>

// DESPUÉS:
return <div className="splash">{navigator.language.startsWith('es') ? 'Cargando…' : 'Loading…'}</div>
```

### C-5: C1 — Fechas de aportes formateadas (`AhorroSection.jsx:537`)

```jsx
// ANTES:
<span className="aporte-fecha">{a.fecha}</span>

// DESPUÉS (T12:00 evita desfase horario al parsear solo fecha):
<span className="aporte-fecha">
  {new Date(a.fecha + 'T12:00').toLocaleDateString(
    lang === 'es' ? 'es-ES' : 'en-GB',
    { day: 'numeric', month: 'short' }
  )}
</span>
```

### C-6: C2 — Limitar carga de aportes a 50 (`AhorroSection.jsx:66`)

```js
// ANTES:
supabase.from('ahorro_aportes').select('*').eq('hogar_id', hogarId).order('fecha', { ascending: false }),

// DESPUÉS:
supabase.from('ahorro_aportes').select('*').eq('hogar_id', hogarId).order('fecha', { ascending: false }).limit(50),
```

### C-7: C3 — Chips de importe rápido en form de aporte (`AhorroSection.jsx:312-324`)

```jsx
// Insertar DESPUÉS del input de importe (línea 324), ANTES del select de objetivos:
<div className="quick-amounts">
  {[10, 25, 50, 100, 200].map(n => (
    <button
      key={n}
      type="button"
      className={`quick-amt-chip${Number(aporteImporte) === n ? ' quick-amt-active' : ''}`}
      onClick={() => setAporteImporte(String(n))}
    >{n}€</button>
  ))}
</div>
// CSS (añadir a App.css):
// .quick-amounts { display: flex; gap: 0.4rem; flex-wrap: wrap; }
// .quick-amt-chip { padding: 0.25rem 0.6rem; border-radius: 999px; border: 1px solid var(--border); background: var(--bg2); font-size: 0.8rem; cursor: pointer; }
// .quick-amt-active { background: var(--accent); color: #fff; border-color: var(--accent); }
```

### C-8: C4 — Botón "Archivar" directo en objetivo completado (`AhorroSection.jsx:507`)

```jsx
// Insertar DESPUÉS del botón de retirada (línea 507), dentro del bloque done:
{done && (
  <button
    className="goal-archive-btn"
    onClick={() => handleArchiveGoal(o)}
    title={es ? 'Archivar objetivo completado' : 'Archive completed goal'}
  >✓ {es ? 'Archivar' : 'Archive'}</button>
)}
```

### C-9: V4 — "Ver más" en historial de aportes (`AhorroSection.jsx:529-531`)

```jsx
// 1. Añadir estado (junto a otros estados del componente):
const [showAllAportes, setShowAllAportes] = useState(false)

// 2. Líneas 529-531 — reemplazar slice hardcoded:
// ANTES:
{aportes.slice(0, 8).map(a => {
// DESPUÉS:
{(showAllAportes ? aportes : aportes.slice(0, 8)).map(a => {

// 3. Después del cierre del map (después de línea 547), añadir botón:
{aportes.length > 8 && (
  <button className="btn-sm btn-ghost" onClick={() => setShowAllAportes(v => !v)} style={{ width: '100%', marginTop: '0.25rem' }}>
    {showAllAportes
      ? (es ? '▲ Ver menos' : '▲ Show less')
      : (es ? `▼ Ver todos (${aportes.length})` : `▼ Show all (${aportes.length})`)}
  </button>
)}
```

---

## Sprint B — Código listo para aplicar (features de alto impacto, ~30 min)

> Confirmar con "aplica Sprint B" para que Claude ejecute los cambios de una vez.
> Requiere migraciones 004 ya aplicada (columnas `fecha_objetivo` y `emoji` en `objetivos`).

### B-1: Z1 — Actividades clicables para navegar al movimiento

**`ActivityPanel.jsx` — 3 cambios:**

```jsx
// 1. Línea 19 — añadir onNavigate a props:
export default function ActivityPanel({ open, onClose, actividades, currentUserId, usuarios, lastViewedAt, onNavigate }) {

// 2. Reemplazar líneas 64-74 (item render) con versión clickable:
{group.items.map(a => {
  const isNew = lastViewedAt && a.actor_id !== currentUserId && a.creado_en > lastViewedAt
  const canNav = onNavigate && a.entidad === 'movimiento' && a.entidad_id && a.payload?.anio && a.payload?.mes
  const Tag = canNav ? 'button' : 'div'
  return (
    <Tag
      key={a.id}
      className={`activity-item${isNew ? ' activity-item-new' : ''}${canNav ? ' activity-item-link' : ''}`}
      onClick={canNav ? () => { onNavigate(a.payload.anio, a.payload.mes, a.entidad_id); onClose() } : undefined}
      type={canNav ? 'button' : undefined}
    >
      <div className="activity-meta">
        <span className="activity-actor">{actorName(a.actor_id)}</span>
        <span className="activity-time">{timeAgo(a.creado_en, lang)}</span>
      </div>
      <div className="activity-text">{a.resumen}</div>
      {canNav && <span className="activity-nav-hint">→</span>}
    </Tag>
  )
})}
```

**`MesView.jsx` — 3 cambios:**

```jsx
// 1. Línea 46 — añadir estado highlight después de showActivity:
const [highlightMovId, setHighlightMovId] = useState(null)

// 2. Línea 2721 — añadir clase highlight al item:
// ANTES:
className={`movement-item-wrap${m.pendiente ? ' movement-item-wrap-pending' : ''}`}
// DESPUÉS:
className={`movement-item-wrap${m.pendiente ? ' movement-item-wrap-pending' : ''}${m.id === highlightMovId ? ' movement-item-highlight' : ''}`}

// 3. Líneas 3113-3120 — añadir onNavigate al ActivityPanel:
<ActivityPanel
  open={showActivity}
  onClose={() => setShowActivity(false)}
  actividades={actividades}
  currentUserId={profile?.id}
  usuarios={usuarios}
  lastViewedAt={profile?.actividad_vista_en}
  onNavigate={(navAnio, navMes, movId) => {
    setAnio(navAnio); setMes(navMes); setHighlightMovId(movId)
    setTimeout(() => setHighlightMovId(null), 3000)
  }}
/>
```

**`App.css` — añadir al final:**

```css
.activity-item-link {
  cursor: pointer; background: none; border: none;
  width: 100%; text-align: left; padding: inherit;
}
.activity-item-link:hover { background: var(--bg-hover, rgba(0,0,0,.05)); }
.activity-nav-hint { margin-left: auto; opacity: 0.4; font-size: 0.8rem; }
.movement-item-highlight { animation: highlight-pulse 3s ease-out; }
@keyframes highlight-pulse {
  0%, 30% { background: var(--accent, #007AFF22); border-radius: 6px; }
  100% { background: transparent; }
}
```

---

### B-2: Z2 + Z3 — Fecha objetivo y emoji en formulario de objetivos

**`AhorroSection.jsx` — 5 cambios:**

```jsx
// 1. Línea 33 — añadir estados (después de goalMensual):
const [goalFecha, setGoalFecha] = useState('')
const [goalEmoji, setGoalEmoji] = useState('')

// 2. Línea 181 — añadir campos al objeto row:
const row = {
  nombre,
  presupuesto: isNaN(presupuesto) || presupuesto <= 0 ? null : presupuesto,
  aporte_mensual: isNaN(mensual) || mensual <= 0 ? null : mensual,
  fecha_objetivo: goalFecha || null,
  emoji: goalEmoji.trim() || null,
}

// 3. Línea 190 — añadir reset en cierre del formulario:
setShowGoalForm(false); setEditGoal(null); setGoalNombre(''); setGoalPresupuesto('');
setGoalMensual(''); setGoalFecha(''); setGoalEmoji('')

// 4. Líneas 206-209 — cargar valores al editar:
function openGoalForm(goal = null) {
  setEditGoal(goal)
  setGoalNombre(goal?.nombre ?? '')
  setGoalPresupuesto(goal?.presupuesto ? String(goal.presupuesto) : '')
  setGoalMensual(goal?.aporte_mensual ? String(goal.aporte_mensual) : '')
  setGoalFecha(goal?.fecha_objetivo ?? '')
  setGoalEmoji(goal?.emoji ?? '')

// 5. Después del input de goalMensual (línea 450) — añadir 2 inputs:
<div style={{ display: 'flex', gap: '0.5rem' }}>
  <input
    className="ahorro-input"
    type="text"
    maxLength={2}
    placeholder="🎯"
    value={goalEmoji}
    onChange={e => setGoalEmoji(e.target.value)}
    style={{ width: '3.5rem', textAlign: 'center', fontSize: '1.25rem' }}
  />
  <input
    className="ahorro-input"
    type="date"
    value={goalFecha}
    onChange={e => setGoalFecha(e.target.value)}
    style={{ flex: 1 }}
  />
</div>
```

---

### B-3: Z8 — Fecha personalizada al hacer un aporte

**`AhorroSection.jsx` — 4 cambios:**

```jsx
// 1. Línea 18 — añadir estado (después de aporteNota):
const [aporteDate, setAporteDate] = useState('')

// 2. Línea 110 — añadir reset en closeAporte:
function closeAporte() {
  setShowAporte(false); setAporteImporte(''); setAporteObjetivo('');
  setAporteNota(''); setAporteDate('')
}

// 3. Línea 131 — usar fecha seleccionada:
// ANTES:
fecha: new Date().toISOString().slice(0, 10),
// DESPUÉS:
fecha: aporteDate || new Date().toISOString().slice(0, 10),

// 4. Líneas 331-338 — añadir input de fecha después de la nota:
<input
  className="ahorro-input"
  type="date"
  value={aporteDate}
  max={new Date().toISOString().slice(0, 10)}
  onChange={e => setAporteDate(e.target.value)}
/>
```

---

## Sprint A — Código listo para aplicar (bugs, riesgo cero, ~10 min)

> Confirmar con "aplica Sprint A" para que Claude ejecute los 5 cambios de una vez.

### A-1: X1 — timeAgo bug (`i18n.js:280`)
```js
// ANTES (línea 280):
return new Date(dateStr).toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })

// DESPUÉS — insertar ANTES de la línea anterior:
if (secs < 604800) return `${Math.floor(secs / 86400)}${t(lang, 'day_ago')}`
return new Date(dateStr).toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })
```

### A-2: A2 — Apóstrofe rompe búsqueda (`BusquedaGlobal.jsx:49-50`)
```js
// ANTES:
const esc = q.replace(/[%_,()]/g, ' ').trim()

// DESPUÉS:
const esc = q.replace(/[%_,()']/g, ' ').trim()
```

### A-3: W2 — Vista anual cuenta pendientes como reales (`MesView.jsx:~450`)
```js
// Buscar en loadYearData la query de movimientos y añadir .eq('pendiente', false):
// ANTES:
.eq('hogar_id', hogarId).eq('anio', anioVista)
// DESPUÉS:
.eq('hogar_id', hogarId).eq('anio', anioVista).eq('pendiente', false)
```

### A-4: B6 — theme_color incorrecto en manifest (`vite.config.js:25`)
```js
// ANTES:
theme_color: '#ffffff',

// DESPUÉS:
theme_color: '#f2f2f7',
```

### A-5: A8 — select('*') en AuthContext (`AuthContext.jsx:26`)
```js
// ANTES:
const { data } = await supabase.from('usuarios').select('*').eq('id', uid).single()

// DESPUÉS:
const { data } = await supabase.from('usuarios').select('id, hogar_id, idioma, actividad_vista_en').eq('id', uid).single()
```

---

## Sprint ACT-NAV — Código listo para aplicar (navegar al mes desde panel de actividad, ~10 min)

> Sin SQL. Confirmar con "aplica Sprint ACT-NAV".
> **Impacto:** la notificación "Tu pareja añadió Netflix 12.99€" no lleva a ningún sitio. Con este sprint cada item de movimiento muestra "→ Jun 2025" y tapearlo cierra el panel y navega al mes correcto. Fundamental para la experiencia de pareja.

### ACT-NAV-1 · ActivityPanel.jsx — prop `onNavigate` + botón de navegación

**Cambio 1** — añadir `onNavigate` a la firma del componente:
```
// de:
export default function ActivityPanel({ open, onClose, actividades, currentUserId, usuarios, lastViewedAt }) {
// a:
export default function ActivityPanel({ open, onClose, actividades, currentUserId, usuarios, lastViewedAt, onNavigate }) {
```

**Cambio 2** — en el map de items, reemplazar el `<div>` de cada item:
```jsx
// ANTES:
                    <div key={a.id} className={`activity-item${isNew ? ' activity-item-new' : ''}`}>
                      <div className="activity-meta">
                        <span className="activity-actor">{actorName(a.actor_id)}</span>
                        <span className="activity-time">{timeAgo(a.creado_en, lang)}</span>
                      </div>
                      <div className="activity-text">{a.resumen}</div>
                    </div>

// DESPUÉS:
                    <div key={a.id} className={`activity-item${isNew ? ' activity-item-new' : ''}`}>
                      <div className="activity-meta">
                        <span className="activity-actor">{actorName(a.actor_id)}</span>
                        <span className="activity-time">{timeAgo(a.creado_en, lang)}</span>
                        {onNavigate && a.payload?.anio && a.payload?.mes && (
                          <button
                            className="activity-nav-btn"
                            onClick={() => onNavigate(a.payload.anio, a.payload.mes)}
                            title={lang === 'es'
                              ? `Ir a ${MONTHS[lang][a.payload.mes - 1]} ${a.payload.anio}`
                              : `Go to ${MONTHS[lang][a.payload.mes - 1]} ${a.payload.anio}`}
                          >
                            → {MONTHS[lang][a.payload.mes - 1].slice(0, 3)} {a.payload.anio}
                          </button>
                        )}
                      </div>
                      <div className="activity-text">{a.resumen}</div>
                    </div>
```

### ACT-NAV-2 · MesView.jsx — pasar `onNavigate` al ActivityPanel (línea ~3113)

```jsx
// ANTES:
      <ActivityPanel
        open={showActivity}
        onClose={() => setShowActivity(false)}
        actividades={actividades}
        currentUserId={profile?.id}
        usuarios={usuarios}
        lastViewedAt={profile?.actividad_vista_en}
      />

// DESPUÉS:
      <ActivityPanel
        open={showActivity}
        onClose={() => setShowActivity(false)}
        actividades={actividades}
        currentUserId={profile?.id}
        usuarios={usuarios}
        lastViewedAt={profile?.actividad_vista_en}
        onNavigate={(a, m) => { setAnio(a); setMes(m); setShowActivity(false) }}
      />
```

### ACT-NAV-3 · App.css — estilo del botón de navegación

```css
.activity-nav-btn {
  background: none;
  border: none;
  padding: 0 0 0 0.5rem;
  font-size: 0.7rem;
  color: var(--accent);
  cursor: pointer;
  opacity: 0.8;
  white-space: nowrap;
}
.activity-nav-btn:hover { opacity: 1; text-decoration: underline; }
```

**Nota:** `a.payload` viene de Supabase como JSON; los campos `anio` y `mes` son enteros (no strings) — no hace falta parseInt.

---

## Sprint SHARE — Código listo para aplicar (Web Share API en resumen, ~5 min)

> Sin SQL. Confirmar con "aplica Sprint SHARE".
> **Impacto:** en una PWA de pareja lo más natural es compartir el resumen por WhatsApp o Telegram. Con Web Share API (disponible en iOS Safari, Android Chrome y cualquier PWA instalada) el botón "Copiar resumen" pasa a abrir la hoja nativa de compartir. En desktop sin soporte sigue funcionando con el portapapeles.

### SHARE-1 · MesView.jsx — función `copiarResumen` (línea ~1065)

```
// Cambiar la última línea de la función, de:
    navigator.clipboard?.writeText(lines.join('\n')).then(() => showToast(lang === 'es' ? 'Resumen copiado' : 'Summary copied'))

// por:
    const text = lines.join('\n')
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).then(() => showToast(lang === 'es' ? 'Resumen copiado' : 'Summary copied'))
    }
```

**Nota:** `.catch(() => {})` absorbe el `AbortError` cuando el usuario cierra la hoja sin compartir. No hace falta más manejo de errores.

---

## Sprint OFFLINE — Código listo para aplicar (banner modo sin conexión, ~10 min)

> Sin SQL. Confirmar con "aplica Sprint OFFLINE".
> **Impacto:** la app es PWA pero no avisa cuando no hay red. Si Supabase falla en silencio el usuario no sabe si su gasto se guardó. Un banner discreto elimina esa ambigüedad.

### OFFLINE-1 · MesView.jsx — estado `isOnline` + listeners (después de línea ~203)

```js
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const up = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
```

### OFFLINE-2 · MesView.jsx — banner en el JSX (justo antes del primer div del layout, al inicio del return)

```jsx
      {!isOnline && (
        <div className="offline-banner" role="alert">
          {lang === 'es' ? '⚠ Sin conexión — los cambios no se guardarán' : '⚠ Offline — changes won\'t be saved'}
        </div>
      )}
```

### OFFLINE-3 · App.css — estilo

```css
.offline-banner {
  position: sticky;
  top: 0;
  z-index: 200;
  background: var(--warn, #f59e0b);
  color: #fff;
  text-align: center;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
}
```

---

## Sprint INPUTMODE — Código listo para aplicar (teclado decimal en inputs numéricos móvil, ~5 min)

> Sin SQL. Confirmar con "aplica Sprint INPUTMODE".
> **Impacto:** 8 inputs de tipo `number` no tienen `inputMode="decimal"`. En Android esto abre el teclado numérico sin punto/coma decimal en algunos dispositivos, forzando el teclado completo para escribir importes. Añadir el atributo no cambia ninguna lógica.

### INPUTMODE-1 · MesView.jsx — inputs de presupuesto (líneas ~2262 y ~2343)

```
// Línea ~2262 — budget-inline-input (categoría): añadir tras step="0.01"
                                inputMode="decimal"

// Línea ~2343 — budget-inline-input-sm (subcategoría): añadir tras step="0.01"
                                inputMode="decimal"
```

### INPUTMODE-2 · AhorroSection.jsx — 5 inputs (líneas 271, 316, 357, 435, 444)

```
// En cada uno de los 5 type="number" sin inputMode, añadir la línea siguiente:
              inputMode="decimal"
// (p.ej. línea 271: queda type="number" seguido de inputMode="decimal" en la línea siguiente)
```

### INPUTMODE-3 · PlantillasModal.jsx — 1 input de importe (línea ~210)

```
// type="number" en el formulario de nueva plantilla: añadir tras type="number"
                      inputMode="decimal"
```

---

## Sprint CSV2 — Código listo para aplicar (añadir metodo_pago al CSV, ~5 min)

> Sin SQL. Confirmar con "aplica Sprint CSV2".
> **Impacto:** el CSV mensual exporta fecha, tipo, concepto, importe, categoría, subcategoría, fijo, pendiente, nota — pero falta `metodo_pago`. Útil para conciliación bancaria y para saber cuánto se ha gastado en efectivo.

### CSV2-1 · MesView.jsx — función `exportarCSV` (~línea 1013)

```
// Header — cambiar de:
    const header = ['fecha', 'tipo', 'concepto', 'importe', 'categoria', 'subcategoria', 'fijo', 'pendiente', 'nota'].join(',')
// a:
    const header = ['fecha', 'tipo', 'concepto', 'importe', 'categoria', 'subcategoria', 'fijo', 'pendiente', 'metodo_pago', 'nota'].join(',')
```

```
// En el map de rows, después de m.pendiente ? '1' : '0', añadir:
      m.metodo_pago ?? 'tarjeta',
// (antes de la línea de la nota)
```

---

## Sprint LOGIN-PWD — Código listo para aplicar ("Olvidé mi contraseña", ~15 min)

> Sin SQL. Confirmar con "aplica Sprint LOGIN-PWD".
> **Impacto:** un usuario que olvida su contraseña está completamente bloqueado — no hay ningún enlace de recuperación. Supabase tiene `resetPasswordForEmail()` integrado; solo hay que añadir el flujo en LoginPage. Es el único bloqueador duro de acceso que existe en la app.

### LOGIN-PWD-1 · LoginPage.jsx — añadir estado + función + enlace (3 cambios)

**Cambio 1** — nuevos estados al inicio del componente:
```js
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
```

**Cambio 2** — función de envío del correo de recuperación (después de `handleSubmit`):
```js
  async function handleResetPassword(e) {
    e.preventDefault()
    setResetLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (error) setError(loginLang === 'es' ? 'No se pudo enviar el correo' : 'Could not send email')
      else setResetSent(true)
    } catch {
      setError(loginLang === 'es' ? 'Error inesperado' : 'Unexpected error')
    } finally {
      setResetLoading(false)
    }
  }
```

**Cambio 3** — en el JSX, reemplazar la sección de login según el estado:
```jsx
// Añadir justo antes del cierre de </div className="login-card">:
        {!resetMode ? (
          <button
            type="button"
            className="login-forgot"
            onClick={() => { setResetMode(true); setError('') }}
          >
            {loginLang === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
          </button>
        ) : resetSent ? (
          <p className="login-reset-sent">
            {loginLang === 'es'
              ? '✓ Correo enviado. Revisa tu bandeja de entrada.'
              : '✓ Email sent. Check your inbox.'}
          </p>
        ) : (
          <form onSubmit={handleResetPassword} className="login-form">
            <p className="login-sub" style={{ marginBottom: '0.75rem' }}>
              {loginLang === 'es'
                ? 'Introduce tu correo para recibir el enlace de recuperación.'
                : 'Enter your email to receive a recovery link.'}
            </p>
            <div className="field">
              <label htmlFor="lp-reset-email">{loginLang === 'es' ? 'Correo' : 'Email'}</label>
              <input
                id="lp-reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                autoFocus
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn-primary btn-full" disabled={resetLoading}>
              {resetLoading
                ? (loginLang === 'es' ? 'Enviando…' : 'Sending…')
                : (loginLang === 'es' ? 'Enviar enlace' : 'Send link')}
            </button>
            <button type="button" className="login-forgot" onClick={() => { setResetMode(false); setError('') }}>
              {loginLang === 'es' ? '← Volver al login' : '← Back to login'}
            </button>
          </form>
        )}
```

### LOGIN-PWD-2 · App.css — 2 reglas de estilo

```css
.login-forgot {
  background: none;
  border: none;
  color: var(--text3);
  font-size: 0.8rem;
  cursor: pointer;
  margin-top: 0.5rem;
  text-decoration: underline;
  display: block;
  width: 100%;
  text-align: center;
}
.login-reset-sent {
  color: var(--green, #16a34a);
  font-size: 0.85rem;
  text-align: center;
  margin-top: 0.75rem;
}
```

---

## Sprint EFECT-FILTER — Código listo para aplicar (filtro por método de pago, ~15 min)

> Sin SQL. Confirmar con "aplica Sprint EFECT-FILTER".
> **Impacto:** el chip "💵 Efectivo" ya muestra el saldo pero al pulsarlo no filtra la lista por efectivo. Los usuarios que usan efectivo habitualmente quieren ver rápidamente "qué gastos he hecho en efectivo este mes". Un filtro por método de pago en el panel de filtros cubre este caso.

### EFECT-FILTER-1 · MesView.jsx — 4 cambios

**Cambio 1** — añadir estado `filtroMetodo` junto a los otros filtros (~línea 152):
```js
  const [filtroMetodo, setFiltroMetodo] = useState(null)
```

**Cambio 2** — añadir al filtro de `movimientosFiltrados` (~línea 1215, dentro del useMemo de filtros):
```
// Añadir después de .filter(m => !filterDate || m.fecha === filterDate):
      .filter(m => !filtroMetodo || m.metodo_pago === filtroMetodo)
```
(Y añadir `filtroMetodo` al array de dependencias del useMemo)

**Cambio 3** — en la barra de filtros, añadir los chips de método de pago (después de los chips de tipo gasto/ingreso, ~línea 2520):
```jsx
              {/* Filtro método de pago */}
              <div className="filters-panel-group">
                <span className="filters-panel-label">{lang === 'es' ? 'Método pago' : 'Payment'}</span>
                {['tarjeta', 'efectivo', 'transferencia', 'bizum'].map(mp => (
                  <button
                    key={mp}
                    className={`filters-panel-opt${filtroMetodo === mp ? ' fp-opt-active' : ''}`}
                    onClick={() => { setFiltroMetodo(filtroMetodo === mp ? null : mp); localStorage.setItem('filtroMetodo', filtroMetodo === mp ? '' : mp) }}
                  >
                    {mp === 'tarjeta' ? '💳' : mp === 'efectivo' ? '💵' : mp === 'transferencia' ? '🏦' : '📱'} {mp}
                  </button>
                ))}
              </div>
```

**Cambio 4** — en la función `resetFilters` (donde se resetean todos los filtros), añadir:
```
setFiltroMetodo(null)
```

**Cambio 5** — incluir `filtroMetodo` en el indicador de "hay filtros activos" (`hayFiltroActivo`), si no ya lo cubre por variables derivadas.

### EFECT-FILTER-2 · MesView.jsx — actualizar `hayFiltroActivo`

```
// Buscar la definición de hayFiltroActivo y añadir || !!filtroMetodo
// p.ej.:
const hayFiltroActivo = filtroTipo !== 'all' || !!filtroCatId || filtroFijo !== null || filtroPendiente || !!filterDate || !!filtroMetodo
```

---

## Sprint CAT-REORDER — Código listo para aplicar (reordenar categorías ↑↓, ~15 min)

> Sin SQL. Confirmar con "aplica Sprint CAT-REORDER".
> **Impacto:** el campo `orden` existe en la tabla `categorias` y controla el orden en presupuesto y lista de movimientos. Pero no hay UI para cambiarlo — el usuario no puede reorganizar sus categorías una vez creadas. Añadir botones ↑↓ en CategoriasModal.

### CAT-REORDER-1 · CategoriasModal.jsx — función `handleReorderCat` + botones

**Cambio 1** — añadir función `handleReorderCat` después de `handleRenameCat`:
```js
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
```

**Cambio 2** — en el render de cada categoría activa, añadir los botones ↑↓ junto a los botones existentes de emoji/color/rename. Buscar donde se muestra el nombre de la categoría en el map de `activeCats` y añadir:
```jsx
                    <button
                      className="btn-icon cat-reorder-btn"
                      onClick={() => handleReorderCat(cat.id, -1)}
                      title={lang === 'es' ? 'Subir' : 'Move up'}
                      disabled={activeCats.indexOf(cat) === 0}
                    >↑</button>
                    <button
                      className="btn-icon cat-reorder-btn"
                      onClick={() => handleReorderCat(cat.id, 1)}
                      title={lang === 'es' ? 'Bajar' : 'Move down'}
                      disabled={activeCats.indexOf(cat) === activeCats.length - 1}
                    >↓</button>
```

### CAT-REORDER-2 · App.css — estilo de los botones de reorden

```css
.cat-reorder-btn {
  font-size: 0.75rem;
  opacity: 0.5;
  padding: 0 0.2rem;
}
.cat-reorder-btn:hover:not(:disabled) { opacity: 1; }
.cat-reorder-btn:disabled { cursor: default; opacity: 0.2; }
```

**Nota técnica:** el swap de valores de `orden` es idempotente (dos updates independientes) — si uno falla la UI queda algo inconsistente pero no corrompe datos. Para garantía absoluta habría que hacerlo en una RPC SQL, pero para categorías personales no merece la complejidad.

---

## Sprint CSV-SUBCAT — Código listo para aplicar (bug: subcategoría ignorada al importar CSV, ~10 min)

> Sin SQL. Confirmar con "aplica Sprint CSV-SUBCAT".
> **Tipo: BUG SILENCIOSO.** El parser de `ImportarCSVModal` detecta la columna `subcategoria` (línea 40) pero nunca lee su valor al construir la fila, por lo que al importar un CSV con subcategorías estas se pierden sin error ni aviso. Este sprint también añade `metodo_pago` al import para que sea simétrico con el export (Sprint CSV2).

### CSV-SUBCAT-1 · ImportarCSVModal.jsx — función `parseCSV`

**Cambio 1** — en el bloque de variables del map (después de `catId`, ~línea 63), añadir:
```js
    const subcatNombre = get('subcategoria').toLowerCase()
    const subcatByName = {}
    // construir el índice de subcategorías para esta categoría
    // (se pasa como argumento adicional — ver cambio 3)
    const subcatId = catId ? (subcatsByName[`${catId}::${subcatNombre}`] ?? null) : null
    const metodoPago = (() => {
      const mp = get('metodo_pago').toLowerCase()
      return ['tarjeta', 'efectivo', 'transferencia', 'bizum'].includes(mp) ? mp : 'tarjeta'
    })()
```

**Cambio 2** — añadir `subcatId` y `metodoPago` al objeto retornado por `parseCSV` (después de `pendiente`):
```js
      subcatId,
      metodoPago,
```

**Cambio 3** — modificar la firma de `parseCSV` para recibir también `subcategorias`:
```
// de:
function parseCSV(text, categorias) {
// a:
function parseCSV(text, categorias, subcategorias) {
```
Y añadir la construcción del índice de subcats al inicio de la función (antes del map):
```js
  // Índice: "catId::subcatNombre" → subcatId
  const subcatsByName = {}
  subcategorias.forEach(s => {
    subcatsByName[`${s.categoria_id}::${s.nombre.toLowerCase()}`] = s.id
  })
```

**Cambio 4** — actualizar la llamada a `parseCSV` en el `useEffect` que procesa el archivo:
```
// de:
setRows(parseCSV(text, categorias))
// a:
setRows(parseCSV(text, categorias, subcategorias))
```

**Cambio 5** — añadir `subcategorias` a los props del componente `ImportarCSVModal`:
```
// de:
export default function ImportarCSVModal({ open, onClose, hogarId, userId, categorias, lang, anio, mes, onImported }) {
// a:
export default function ImportarCSVModal({ open, onClose, hogarId, userId, categorias, subcategorias = [], lang, anio, mes, onImported }) {
```

**Cambio 6** — en `handleImport`, añadir `subcategoria_id` y `metodo_pago` al objeto de insert (~línea 137):
```
// Añadir en el .map(r => ({...})):
        subcategoria_id: r.subcatId ?? null,
        metodo_pago: r.metodoPago ?? 'tarjeta',
```

**Cambio 7** — en `MesView.jsx` (~línea 3040 donde se instancia `ImportarCSVModal`), añadir el prop `subcategorias`:
```jsx
        subcategorias={subcategorias}
```

**Cambio 8** — actualizar el texto de ayuda del import para mencionar el campo `metodo_pago`:
```
// de: '...fijo (0/1), pendiente (0/1), nota...'
// a:  '...fijo (0/1), pendiente (0/1), metodo_pago (tarjeta/efectivo/transferencia/bizum), nota...'
```

---

## Sprint TREND-NAV — Código listo para aplicar (navegar al mes desde barras de tendencia, ~10 min)

> Sin SQL. Confirmar con "aplica Sprint TREND-NAV".
> **Impacto:** las barras de tendencia (últimos 6 meses) muestran cada mes con su label "Ene", "Feb"… pero no son navegables. `rawTrend` ya tiene `anio` y `mes` por elemento — solo falta pasarlos al componente y conectar el click a `setAnio/setMes`. Mismo patrón que Sprint ACT-NAV.

### TREND-NAV-1 · GraficasMes.jsx — añadir `onNavigate` a TrendBars

**Cambio 1** — añadir prop `onNavigate` al componente `TrendBars`:
```
// de:
function TrendBars({ data, fmt, lang }) {
// a:
function TrendBars({ data, fmt, lang, onNavigate }) {
```

**Cambio 2** — en el botón de cada columna (`trend-col`), añadir `onDoubleClick` para navegar (single click ya muestra el tooltip, double click navega):
```jsx
// Dentro del button .trend-col, añadir:
              onDoubleClick={() => onNavigate?.(d.anio, d.mes)}
              title={onNavigate ? (lang === 'es' ? 'Doble click para ir a este mes' : 'Double-click to navigate to this month') : undefined}
```

### TREND-NAV-2 · GraficasMes.jsx — prop `onNavigate` en el componente principal

```
// de:
export default function GraficasMes({ lang, gastoPorCat, categorias, trendData, fmt, onSelectCat, catColors, catMap, insights, selectedCatId, spendingByDay, anio, mes, onSelectDate, selectedDate, order, onMoveUp, onMoveDown }) {
// a:
export default function GraficasMes({ lang, gastoPorCat, categorias, trendData, fmt, onSelectCat, catColors, catMap, insights, selectedCatId, spendingByDay, anio, mes, onSelectDate, selectedDate, order, onMoveUp, onMoveDown, onNavigate }) {
```

```jsx
// En el render de TrendBars, añadir la prop:
          <TrendBars data={trendData} fmt={fmt} lang={lang} onNavigate={onNavigate} />
```

### TREND-NAV-3 · MesView.jsx — pasar `onNavigate` a GraficasMes (~línea 2838)

```jsx
// Añadir al componente GraficasMes:
              onNavigate={(a, m) => { setAnio(a); setMes(m) }}
```

**Nota:** `trendData` no incluye `anio`/`mes` actualmente — solo tiene `income`, `expenses`, `label`. El cambio más limpio es extender `trendData` en MesView para incluirlos:

```
// En el useMemo de trendData (~línea 472):
    rawTrend.map(d => ({
      ...d,
      label: MONTHS[lang][d.mes - 1].slice(0, 3),
    })),
// rawTrend ya tiene anio y mes, así que el spread los incluye automáticamente. ✓
```

---

## Sprint IMPORTE-SUGGEST — Código listo para aplicar (sugerir importe por historial, ~15 min)

> Sin SQL. Confirmar con "aplica Sprint IMPORTE-SUGGEST".
> **Impacto:** cuando el usuario escribe "Netflix" o selecciona el chip, el campo de importe queda vacío y hay que escribir 12.99 de memoria. Con este sprint, al seleccionar un concepto del historial se pre-rellena el último importe usado. El usuario puede sobrescribirlo — es solo una sugerencia.

### IMPORTE-SUGGEST-1 · MesView.jsx — añadir `importe` a la query de recentConceptos (~línea 323)

```
// de:
      supabase.from('movimientos').select('concepto, categoria_id').eq('hogar_id', hogarId).not('concepto', 'is', null).gte('fecha', since60d).limit(200),
// a:
      supabase.from('movimientos').select('concepto, categoria_id, importe').eq('hogar_id', hogarId).not('concepto', 'is', null).gte('fecha', since60d).limit(200),
```

### IMPORTE-SUGGEST-2 · MovimientoModal.jsx — sugerencia de importe al seleccionar concepto

**Cambio 1** — añadir `importeSugerido` al `useMemo` de `chips` (ya existe, extenderlo):
```js
// Después del useMemo de chips, añadir:
  const importePorConcepto = useMemo(() => {
    const map = {}
    recentConceptos.forEach(r => {
      if (r.concepto && r.importe) map[r.concepto] = Number(r.importe)
    })
    return map
  }, [recentConceptos])
```

**Cambio 2** — en el `onClick` de cada chip de concepto (~línea 290):
```jsx
// de:
                  onClick={() => setConcepto(chip)}
// a:
                  onClick={() => {
                    setConcepto(chip)
                    if (!importe && importePorConcepto[chip]) setImporte(String(importePorConcepto[chip]))
                  }}
```

**Cambio 3** — en el `onChange` del datalist de concepto, cuando el usuario selecciona un valor sugerido (~línea 272):
```jsx
// Añadir onInput al input de concepto (onInput dispara cuando se selecciona del datalist):
              onInput={e => {
                const val = e.target.value
                if (!importe && importePorConcepto[val]) setImporte(String(importePorConcepto[val]))
              }}
```

**Nota:** la condición `!importe` garantiza que la sugerencia solo se aplica si el campo está vacío — nunca sobrescribe lo que el usuario ya escribió.

---

## Sprint REALTIME-FULL — Código listo para aplicar (Realtime en presupuestos y ahorro, ~15 min)

> Sin SQL. Confirmar con "aplica Sprint REALTIME-FULL".
> **Impacto:** el canal Realtime actual solo escucha `movimientos` y `actividad`. Si tu pareja cambia un presupuesto de categoría o hace un aporte al ahorro, no lo ves hasta que refrescas. Extender el canal a `presupuestos` y `ahorro_aportes` hace la app verdaderamente en tiempo real para la pareja.

### Archivo: `src/pages/MesView.jsx` — extender canal Realtime (línea ~515)

**Buscar el bloque:**
```jsx
    const channel = supabase
      .channel(`hogar-rt-${hogarId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'actividad', filter: `hogar_id=eq.${hogarId}` },
        (payload) => {
          setActividades(prev => [payload.new, ...prev].slice(0, 50))
          if (payload.new.actor_id !== profile?.id) {
            setUnread(n => n + 1)
            const actor = usuariosRef.current.find(u => u.id === payload.new.actor_id)
            const currentLang = langRef.current
            const name = actor?.nombre ?? (currentLang === 'es' ? 'Tu pareja' : 'Your partner')
            const detail = payload.new.detalle ?? ''
            showToastRef.current(`${name}: ${detail}`, 'info')
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
```

**Reemplazar con:**
```jsx
    const channel = supabase
      .channel(`hogar-rt-${hogarId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'actividad', filter: `hogar_id=eq.${hogarId}` },
        (payload) => {
          setActividades(prev => [payload.new, ...prev].slice(0, 50))
          if (payload.new.actor_id !== profile?.id) {
            setUnread(n => n + 1)
            const actor = usuariosRef.current.find(u => u.id === payload.new.actor_id)
            const currentLang = langRef.current
            const name = actor?.nombre ?? (currentLang === 'es' ? 'Tu pareja' : 'Your partner')
            const detail = payload.new.detalle ?? ''
            showToastRef.current(`${name}: ${detail}`, 'info')
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presupuestos', filter: `hogar_id=eq.${hogarId}` },
        () => {
          if (realtimeDebounce.current) clearTimeout(realtimeDebounce.current)
          realtimeDebounce.current = setTimeout(() => loadMesRef.current?.(), 400)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ahorro_aportes', filter: `hogar_id=eq.${hogarId}` },
        () => {
          if (realtimeDebounce.current) clearTimeout(realtimeDebounce.current)
          realtimeDebounce.current = setTimeout(() => loadMesRef.current?.(), 400)
        }
      )
      .subscribe()
```

**Nota:** el debounce de 400 ms ya existente agrupa los eventos — si la pareja aplica varias plantillas seguidas, se consolida en una sola recarga. `ahorro_aportes` no tiene `hogar_id` propio, lo hereda a través de `objetivos`, pero la tabla sí tiene `objetivo_id`. Para filtrar correctamente habría que hacer la suscripción sin filtro de hogar (y filtrar en el callback). Alternativa más sencilla y segura: sin filtro para `ahorro_aportes`, lo cual es correcto dado que la RLS de Supabase garantiza que solo ves los datos de tu hogar.

**Versión mejorada para `ahorro_aportes` (sin filtro de hogar):**
```jsx
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ahorro_aportes' },
        () => {
          if (realtimeDebounce.current) clearTimeout(realtimeDebounce.current)
          realtimeDebounce.current = setTimeout(() => loadMesRef.current?.(), 400)
        }
      )
```

> ⚠️ Nota sobre RLS: la suscripción sin filtro de hogar en `ahorro_aportes` funciona porque Supabase Realtime respeta la RLS — cada cliente solo recibe los eventos de sus propios registros. Sin embargo, requiere que la tabla `ahorro_aportes` tenga RLS habilitada con política basada en `mi_hogar()`. Verificar en Supabase antes de aplicar.

---

## Backlog de mejoras — sesión 2026-06-11

Análisis de 19 rondas completas. ~95 propuestas identificadas, priorizadas por coste/beneficio.

### Tier 0 — Bugs (aplicar ya, riesgo cero)

| ID | Archivo:línea | Problema | Fix (1 línea salvo nota) |
|----|---------------|----------|--------------------------|
| **X1** | `i18n.js:280` | `timeAgo()` devuelve "14:32" para eventos >24h | `if (secs < 604800) return \`${Math.floor(secs/86400)}${t(lang,'day_ago')}\`` |
| **A2** | `BusquedaGlobal.jsx:50` | Apóstrofe en búsqueda rompe ilike | Añadir `\'` en el replace de `esc` |
| **A3** | `ImportarCSVModal.jsx:70` | Fechas inválidas (2024-13-45) pasan validación | Añadir `\|\| isNaN(Date.parse(fecha))` |
| **T9** | `MesView.jsx` | `totalFiltrado` no se muestra con búsqueda de texto activa | 1 línea en condición de visibilidad |
| **W2** | `MesView.jsx:450` | Vista anual suma pendientes como reales | Añadir `.eq('pendiente', false)` a `loadYearData` |
| **B6** | `vite.config.js:25` | `theme_color: '#ffffff'` ≠ meta tag en index.html (`#f2f2f7`) | Cambiar a `'#f2f2f7'` |

### Tier 1 — Schema ya listo, solo falta el frontend

| ID | Descripción | BD | Esfuerzo |
|----|------------|-----|----------|
| **Z1** | Actividades clicables: navegar al movimiento | `actividad.entidad_id` + `payload.{mes,anio}` ya existen | ~20 líneas ActivityPanel + MesView |
| **Z2** | Fecha límite en objetivos de ahorro + cuota mensual | `objetivos.fecha_objetivo date` ya existe | ~15 líneas AhorroSection |
| **Z3** | Emoji en objetivos de ahorro | `objetivos.emoji text` ya existe | ~5 líneas AhorroSection |
| **Z8** | Date input en formulario de aporte | `ahorro_aportes.fecha` ya existe | ~5 líneas AhorroSection |

**Detalle Z1** (más valioso del tier):
- `ActivityPanel.jsx`: cambiar `<div>` a `<button>` cuando `a.entidad === 'movimiento'`
- onClick: `onNavigate?.(a.payload.anio, a.payload.mes, a.entidad_id); onClose()`
- `MesView.jsx`: añadir `highlightId` state + prop `onNavigate` + scroll-to + clase `mov-highlight`

### Tier 2 — Sin SQL, quick wins

**Login / sesión:**
- **U1** `LoginPage.jsx` — "Olvidé mi contraseña" vía `supabase.auth.resetPasswordForEmail` (~15 líneas)
- **A4** `LoginPage.jsx:41/54` — `autoFocus` en email si vacío, en password si email ya guardado (~2 líneas)
- **A5** `App.jsx:12` — Splash "Loading…" hardcodeado en inglés; detectar `navigator.language` (~2 líneas)
- **O2** `App.jsx:20-21` — Si `profile` es null o `profile.hogar_id` es null (usuario en auth sin registro en `usuarios`), la app renderiza MesView silenciosamente vacía sin ningún mensaje de error. Fix: añadir guard antes de `<LangProvider>` y mostrar "Perfil no configurado" + botón Sign out (~8 líneas):
  ```jsx
  if (!profile?.hogar_id) return (
    <div className="splash">
      <p>Perfil no configurado · Profile not set up</p>
      <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 16 }}>Salir / Sign out</button>
    </div>
  )
  ```

**Ahorro:**
- **C1** `AhorroSection.jsx:537` — Fechas de aportes en ISO crudo (`a.fecha` sin formato); usar `toLocaleDateString` (~3 líneas)
- **C2** `AhorroSection.jsx:66` — Query de aportes sin `.limit()`, carga todo el historial (~1 línea: `.limit(50)`)
- **C3** `AhorroSection.jsx:314-324` — Sin chips de importe rápido en formulario de aporte (solo input numérico). Añadir [10, 25, 50, 100, 200] como el modal de movimiento (~8 líneas JSX)
- **C4** `AhorroSection.jsx:480-525` — Objetivo completado (done=true, 🎉) muestra el emoji pero no ofrece botón "Archivar" directo en la fila. Solo accesible a través de openGoalForm(o) + botón en el form. Añadir directo en goal-row when done (~5 líneas)
- **V4** `AhorroSection.jsx:530` — Historial de aportes: `aportes.slice(0, 8)` hardcoded, sin "Ver más". Fix: estado `showAllAportes` + botón que cambie entre 8 y todos (~4 líneas)
- **Z2** `AhorroSection.jsx:422-461` — Formulario de objetivo sin campo `fecha_objetivo` (columna ya existe en BD desde migración 004). Insertar `<input type="date">` entre presupuesto y aporteMensual.
- **Z3** `AhorroSection.jsx:422-461` — Formulario de objetivo sin campo `emoji` (columna ya existe en BD). Añadir emoji picker simple (mismo patrón que CategoriasModal).
- **Z8** `AhorroSection.jsx:311-344` — Formulario de aporte sin `<input type="date">`. `handleAportar` hardcodea `fecha: new Date().toISOString().slice(0, 10)`. Añadir el campo (opcional, por defecto hoy).
- **U7 CRÍTICO** `AhorroSection.jsx:41-53` — `metaMensual` (meta de ahorro mensual) se guarda en `localStorage` por dispositivo, no en BD. Cada miembro de la pareja ve su propia meta independiente. Fix: `ALTER TABLE hogares ADD COLUMN meta_ahorro numeric` + migración + sincronizar via Supabase.

**Filtros y navegación:**
- **D1** `MesView.jsx:1722` — Chip "Efectivo" solo hace scroll, no filtra por `metodo_pago` (~10 líneas + añadir `setFiltroMetodoPago(null)` al shortcut x/X en línea 597)
- **D3** `MesView.jsx:1564` — Dark mode existe (`cycleTheme()`) pero no está en menú ⋯; insertar entre lang y sign-out (~4 líneas)
- **G3** `BusquedaGlobal.jsx:5` — `highlight()` solo resalta primera aparición; reescribir con regex split (~8 líneas)
- **X2** `GraficasMes.jsx:69` — Arcos SVG del donut sin onClick (solo la leyenda lo tiene) (~3 líneas)
- **X8** `GraficasMes.jsx:150` — Doble-click en barra de tendencia no navega al mes (~4 líneas)
- **X5** `GraficasMes.jsx:283` — Gráficas colapsadas por defecto; cambiar a expandidas por defecto (~1 línea)

**Importar / exportar:**
- **A6** `ImportarCSVModal.jsx` — Sin botón "Descargar plantilla CSV" (~12 líneas)
- **CSV5** `ImportarCSVModal.jsx:137-148` — `subcategoria_id` se parsea (`idx.subcategoria`) pero NUNCA se inserta en el objeto de inserción → se silencia. Fix: añadir `subcategoria_id: row[idx.subcategoria] ? subByName[row[idx.subcategoria]] ?? null : null` al objeto insert.
- **CSV6** `ImportarCSVModal.jsx:40-55` — `metodo_pago` no está en el mapeo de columnas CSV. Movimientos importados reciben el default 'tarjeta' siempre, aunque fuesen efectivo. Fix: añadir columna opcional `metodo_pago` (valores: 'tarjeta', 'efectivo').

**Plantillas / presupuesto:**
- **V5** `PlantillasModal.jsx` — Sin badge "ya cargado este mes" en plantillas (~6 líneas). `plantillasNoGeneradas` en MesView no se pasa como prop al modal.
- **PL1** `PlantillasModal.jsx:296-303` — Plantillas no-mensuales muestran el importe bruto ("600 €") pero no el equivalente mensual ("~50 €/mes"). Fix: añadir hint debajo del badge de frecuencia en cada fila con frecuencia ≠ mensual (~3 líneas JSX)
- **PL2** `PlantillasModal.jsx:26-34` — Plantillas ordenadas por `orden` (campo existe en BD) pero sin botones ↑↓ de reordenación en la UI — misma brecha que Y6 en categorías
- **N1** `MesView.jsx` — Sin botón "Confirmar todos los pendientes" bulk (~10 líneas)
- **T8** `MesView.jsx:1731` — Sin `navigator.share`; solo copiar al portapapeles (~5 líneas)
- **W1** `MesView.jsx:1412` — Health score de presupuesto a null en mes actual; modo proyectado (~8 líneas)

**PWA / performance:**
- **Z5** `vite.config.js` — PWA shortcuts para "Nuevo gasto" / "Nuevo ingreso" desde icono (~10 líneas)
- **Z6** `main.jsx:14` + `App.jsx` — Auto-reload silencioso al actualizar SW; mostrar toast (~15 líneas)
- **B3** `vite.config.js` — Manifest sin `categories: ['finance']` (~1 línea)
- **B4** `catNames.js` — `trCat()` no normaliza NFD; falla con acentos (~2 líneas)
- **B5** `vite.config.js:23` — `lang: 'es'` hardcodeado en manifest (~1 línea: eliminar)
- **A8** `AuthContext.jsx:26` — `select('*')` en vez de columnas necesarias (~1 línea)

**UX / categorías:**
- **Y4** `CategoriasModal.jsx` — Sin contador de movimientos antes de archivar (~5 líneas)
- **Y6** `CategoriasModal.jsx` — Sin botones ↑↓ para reordenar (campo `orden` ya existe) (~15 líneas)
- **Y8** `CategoriasModal.jsx:292-305` — Sin forma de cambiar el tipo (gasto→ingreso) de una categoría existente — solo en creación. Fix: añadir `<select tipo>` en la edición inline (~5 líneas)
- **Y10** `CategoriasModal.jsx:105-116` — `handleArchiveCat` no advierte si la categoría tiene subcategorías activas — quedan huérfanas en la BD. Fix: `const activeSubs = allSubcats.filter(s => s.categoria_id === id && !s.archivada)` y mensaje de aviso (~5 líneas)
- **W7** 3 archivos — `window.confirm()` en `MesView.jsx:830,925,993` + `AhorroSection.jsx` + `PlantillasModal.jsx` → confirmación inline (`handleDeleteMov` ya usa undo-toast, no necesita cambio) (~25 líneas total)
- **M1** `MovimientoModal.jsx:530` — Botón "Más opciones" no menciona "efectivo" → reducir fricción para pagos en efectivo (~1 línea)
- **E1** `ErrorBoundary.jsx` — Sin `componentDidCatch`; errores no se loguean (~3 líneas)
- **I1** `i18n.js` — Faltan keys para features de los sprints. Añadir en `es` (línea 127) y en `en` (línea 254) antes del `},`:
  ```js
  // ES (línea 127, antes del cierre }):
  dark_mode: 'Modo oscuro', light_mode: 'Modo claro', auto_mode: 'Modo auto',
  cash: 'Efectivo', deposit: '+ Aportar', withdraw: '− Retirar',
  monthly_goal: 'Meta mensual de ahorro', deposit_title: 'Añadir a la hucha',
  // EN (línea 254, antes del cierre }):
  dark_mode: 'Dark mode', light_mode: 'Light mode', auto_mode: 'Auto mode',
  cash: 'Cash', deposit: '+ Deposit', withdraw: '− Withdraw',
  monthly_goal: 'Monthly savings goal', deposit_title: 'Deposit to pot',
  ```
- **G7** `GuiaModal.jsx` — La guía no menciona el pago en efectivo ni el filtro Efectivo. Actualizar tras aplicar D1 (~3 líneas en ambos idiomas)
- **K1** `periodos` tabla — `cerrado` y `notas` completamente sin uso en frontend. Schema muerto. Opciones: (a) eliminar en futura migración o (b) implementar "Cerrar mes" como Tier 4

### Tier 2b — Accesibilidad (a11y) — sin SQL, riesgo cero

El ⋯ menú y los modales tienen buen inicio pero faltan atributos WAI-ARIA críticos:

| ID | Archivo:línea | Problema | Fix |
|----|---------------|----------|-----|
| **P1** | `MesView.jsx:1538` | Botón ⋯ tiene `aria-expanded` pero no `aria-haspopup="menu"` — lectores no saben que abre un menú | Añadir `aria-haspopup="menu"` (1 línea) |
| **P4** | `MesView.jsx:1546-1568` | `role="menu"` sin `aria-label`; items sin `role="menuitem"` | Añadir `aria-label` al div del menú + `role="menuitem"` a cada button (~6 líneas) |
| **P2** | `MovimientoModal, PlantillasModal, BusquedaGlobal, ImportarCSVModal, CategoriasModal, GuiaModal, MesView:3123 (atajos)` | Ningún modal tiene `role="dialog"` ni `aria-modal="true"` | Añadir ambos atributos al `.modal-card` o wrapper (~1 línea por modal) |
| **P3** | Los mismos 7 modales | Sin `aria-labelledby` apuntando al título del modal | Añadir `id="X-modal-title"` al h2 + `aria-labelledby="X-modal-title"` al card (~2 líneas por modal) |

Todos P1-P4 son cambios de atributos HTML sin lógica. Esfuerzo total ~25 líneas (7 modales).

**Código exacto P1 + P4** (`MesView.jsx:1535-1568`):
```jsx
// P1: añadir aria-haspopup (línea 1538):
aria-haspopup="menu"
aria-expanded={showMenu}

// P4: añadir aria-label al div del menú y role="menuitem" a cada button:
<div className="header-menu" role="menu" aria-label={lang === 'es' ? 'Opciones' : 'Options'}>
  <button className="header-menu-item" role="menuitem" onClick={...}>
```

**Código exacto P2 + P3** (patrón para `MovimientoModal.jsx:199,201`):
```jsx
// Antes:
<div className="modal-card" ref={cardRef}>
  <h2 className="modal-title">

// Después:
<div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="mov-modal-title" ref={cardRef}>
  <h2 id="mov-modal-title" className="modal-title">
// (mismo patrón en PlantillasModal, BusquedaGlobal, ImportarCSVModal, CategoriasModal,
//  GuiaModal y el panel de atajos en MesView:3123, con id únicos en cada uno)
```

### Quick wins adicionales (ronda 23)

- **KB3** `MesView.jsx:594` — No hay atajo de teclado `a`/`A` para el panel de actividad. Solo 2 líneas:
  ```js
  // Insertar en el key handler de MesView.jsx (~línea 594):
  if (e.key === 'a' || e.key === 'A') { setShowActivity(v => !v); return }
  ```
  Y añadir en el panel de atajos (MesView:3150): `A — {lang==='es' ? 'Actividad' : 'Activity'}`
- **O3** `package.json` — `react-router-dom` declarado como dependencia pero **cero usos en el código**. Eliminar limpia el bundle:
  ```bash
  npm uninstall react-router-dom
  ```

### Tier 3 — Esfuerzo medio, sin SQL

- **B1** `catNames.js` — 15+ traducciones EN faltantes para categorías de migración 009
- **B2** `conceptos.js` — 7 entradas de sugerencias faltantes para nuevas categorías (suscripciones, ropa, etc.)
- **U4** `data/conceptos.js` — Completar entradas para cuidado personal, gastos inesperados, gastos extra
- **W5** `MesView.jsx:925` — Preview de valores antes de "sugerir presupuesto desde media"
- **T2** `BusquedaGlobal.jsx` — Resumen patrón "Netflix · 6 veces · 95.94€" cuando hay resultados repetidos
- **W3** `MesView.jsx:446` — `loadYearData` sin presupuesto por mes; comparativa presupuesto vs real
- **X3** `GraficasMes.jsx` — Insights sin delta vs mes anterior
- **GR1** `GraficasMes.jsx:183` — InsightsBlock muestra "categoría frecuente" por nº de transacciones, no por importe total. Falta tarjeta "mayor gasto por total €" (diferente al donut visual)
- **GR2** `GraficasMes.jsx:238` — `SpendingCalendar` heatmap no marca el día de hoy en el mes actual. Añadir clase `today` al botón del día actual (~3 líneas)

### Tier 4 — Requieren 1 SQL migration (✅ archivos generados en `supabase/migrations/`)

| ID | SQL | Migración | Frontend |
|----|-----|-----------|----------|
| **V1** | `CREATE TABLE notas_mes(...)` | `011_notas_mes.sql` ✅ | Nota compartida del mes en hero card |
| **U7** | `ALTER TABLE hogares ADD COLUMN meta_ahorro numeric` | `012_meta_ahorro.sql` ✅ | Meta de ahorro global — **localStorage → BD, crítico para pareja** |
| **Z4** | `ALTER TABLE plantillas_fijas ADD COLUMN metodo_pago text` | `013_plantillas_mejoras.sql` ✅ | Método de pago en plantillas |
| **D2** | `ALTER TABLE plantillas_fijas ADD COLUMN tipo text` | `013_plantillas_mejoras.sql` ✅ | Plantillas de ingreso en PlantillasModal |

### Tier 5 — Optimizaciones de BD (migración 010)

Índices faltantes para consultas frecuentes. SQL listo en `supabase/migrations/010_indexes.sql`.

| ID | SQL | Impacto |
|----|-----|---------|
| **S1** | Índice parcial en `movimientos WHERE pendiente = false` | Aceleraría W2 fix (loadYearData) y cualquier consulta que excluya pendientes |
| **S2** | `pg_trgm` GIN index en `movimientos.concepto` | BusquedaGlobal `ilike('%...%')` pasa de full scan a index scan |
| **S3** | `(hogar_id, fecha DESC)` en `ahorro_aportes` | Historial de aportes ordenado por fecha sin ordenar en memoria |
| **S5** | `entidad_id` en `actividad` | Necesario cuando Z1 permita navegar por actividad_id |
