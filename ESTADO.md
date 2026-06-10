# ESTADO — finanzas-pareja

**Fecha:** 2026-06-10
**Estado:** Activo — desarrollo continuo

---

## Estado actual

App React + Vite PWA con Supabase. **Build limpio. App funcional.** Todas las migraciones pendientes de aplicar en Supabase (005–007).

### Fix crítico aplicado (sesión 2026-06-10 tarde)
- `todayStr` añadido a scope del componente MesView (línea 29). Estaba solo definido dentro de `formatFecha()` causando `ReferenceError` al renderizar el botón "Hoy" y el indicador gasto-vs-media.
- `BusquedaGlobal` call site actualizado para recibir `catColorMap` y `catIconMap`.

### Migraciones pendientes de aplicar en Supabase SQL Editor
- `supabase/migrations/005_subcategory_budgets.sql`
- `supabase/migrations/006_plantillas_frecuencia.sql`
- `supabase/migrations/007_cat_emoji.sql`

### Pendiente de push (código listo, Ángel debe hacer push vía GitHub Desktop)
- 20+ commits con mejoras acumuladas

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

### 2026-06-10 (esta sesión)
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

1. Ángel aplica las migraciones 005–007 en Supabase
2. Ángel hace push del código acumulado
3. Próximas mejoras candidatas:
   - Informe mensual exportable (PDF/imagen)
   - Conexión bancaria PSD2
   - Split de gastos entre personas
   - Swipe para marcar como pagado en móvil
