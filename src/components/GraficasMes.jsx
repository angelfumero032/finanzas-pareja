import { useState } from 'react'
import { t, MONTHS } from '../i18n'

const PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#84cc16',
]

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function DonutChart({ slices, fmt, lang, onSelectCat, selectedCatId }) {
  const [active, setActive] = useState(null)
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) return null

  const CX = 100, CY = 100, R = 82, ri = 54
  let cursor = 0

  const segments = slices.map((sl, i) => {
    const sweep = (sl.value / total) * 360
    const start = cursor
    cursor += sweep
    const end = cursor
    const color = sl.color ?? PALETTE[i % PALETTE.length]
    const pct = sl.value / total

    if (sweep >= 359.98) {
      return { fullCircle: true, color, name: sl.name, value: sl.value, pct, catId: sl.catId }
    }

    const a0 = polar(CX, CY, R, start)
    const a1 = polar(CX, CY, R, end)
    const b0 = polar(CX, CY, ri, start)
    const b1 = polar(CX, CY, ri, end)
    const large = sweep > 180 ? 1 : 0
    return {
      d: `M${a0.x},${a0.y} A${R},${R} 0 ${large} 1 ${a1.x},${a1.y} L${b1.x},${b1.y} A${ri},${ri} 0 ${large} 0 ${b0.x},${b0.y} Z`,
      color, name: sl.name, value: sl.value, pct, catId: sl.catId,
    }
  })

  const selectedIdx = selectedCatId != null
    ? segments.findIndex(s => s.catId === selectedCatId)
    : -1
  const displayActive = selectedIdx >= 0 ? selectedIdx : active

  // Hover overrides center text; selection drives opacity
  const centerIdx = active !== null ? active : displayActive
  const sel = centerIdx !== null && centerIdx !== -1 ? segments[centerIdx] : null
  const centerTop = sel
    ? (sel.name.length > 11 ? sel.name.slice(0, 10) + '…' : sel.name)
    : t(lang, 'total_expenses')
  const centerBot = sel ? fmt(sel.value) : fmt(total)

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" className="donut-svg" aria-hidden="true">
        {segments.map((seg, i) =>
          seg.fullCircle ? (
            <g key={i}>
              <circle cx={CX} cy={CY} r={R} fill={seg.color} />
              <circle cx={CX} cy={CY} r={ri} fill="var(--surface)" />
            </g>
          ) : (
            <path
              key={i} d={seg.d} fill={seg.color}
              stroke="var(--surface)" strokeWidth="2"
              opacity={displayActive === null || displayActive === -1 || displayActive === i ? 1 : 0.35}
              style={{ transition: 'opacity .15s' }}
            />
          )
        )}
        <text x="100" y="94" textAnchor="middle" fontSize="10" fill="var(--text2)" fontFamily="inherit">
          {centerTop}
        </text>
        <text x="100" y="114" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)" fontFamily="inherit">
          {centerBot}
        </text>
      </svg>

      <ul className="donut-legend" role="list">
        {segments.map((seg, i) => (
          <li key={i} className="legend-item-wrap">
            <button
              className={`legend-item${displayActive === i ? ' legend-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => {
                const next = active === i ? null : i
                setActive(next)
                onSelectCat?.(next !== null ? seg.catId : null)
              }}
              aria-pressed={displayActive === i}
              aria-label={`${seg.name}: ${fmt(seg.value)} (${(seg.pct * 100).toFixed(0)}%)`}
            >
              <span className="legend-dot" style={{ background: seg.color }} aria-hidden="true" />
              <span className="legend-name">{seg.name}</span>
              <span className="legend-val">{fmt(seg.value)}</span>
              <span className="legend-pct">{(seg.pct * 100).toFixed(0)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function fmtTrendK(n) {
  const abs = Math.abs(n)
  if (abs >= 1000) return `${(n / 1000).toFixed(0)}k`
  return `${Math.round(n)}`
}

function TrendBars({ data, fmt, lang }) {
  const [activeCol, setActiveCol] = useState(null)
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1)
  const lastIdx = data.length - 1
  const sel = activeCol !== null ? data[activeCol] : null

  return (
    <div className="trend-wrap">
      {sel && (
        <div className="trend-tooltip" onClick={() => setActiveCol(null)} style={{ cursor: 'pointer' }}>
          <span className="trend-tooltip-label">{sel.label}</span>
          {sel.income > 0 && (
            <span className="trend-tooltip-inc">▲ {fmt(sel.income)}</span>
          )}
          {sel.expenses > 0 && (
            <span className="trend-tooltip-exp">▼ {fmt(sel.expenses)}</span>
          )}
          {(sel.income > 0 || sel.expenses > 0) && (
            <span className={`trend-tooltip-net ${sel.income - sel.expenses >= 0 ? 'trend-net-pos' : 'trend-net-neg'}`}>
              = {fmt(sel.income - sel.expenses)}
            </span>
          )}
        </div>
      )}
      <div className="trend-chart">
        {data.map((d, i) => {
          const net = d.income - d.expenses
          const hasData = d.income > 0 || d.expenses > 0
          return (
            <button
              key={i}
              className={`trend-col${i === lastIdx ? ' trend-col-current' : ''}${activeCol === i ? ' trend-col-active' : ''}`}
              onClick={() => setActiveCol(activeCol === i ? null : i)}
              aria-pressed={activeCol === i}
              aria-label={`${d.label}: ${t(lang, 'total_income')} ${fmt(d.income)}, ${t(lang, 'total_expenses')} ${fmt(d.expenses)}`}
            >
              <div className="trend-bars-pair" aria-hidden="true">
                <div className="trend-bar income-bar" style={{ height: `${(d.income / maxVal) * 100}%` }} />
                <div className="trend-bar expense-bar" style={{ height: `${(d.expenses / maxVal) * 100}%` }} />
              </div>
              <span className="trend-label" aria-hidden="true">{d.label}</span>
              {hasData && (
                <span
                  className={`trend-net-badge ${net >= 0 ? 'trend-net-pos' : 'trend-net-neg'}`}
                  aria-hidden="true"
                >
                  {net >= 0 ? '+' : ''}{fmtTrendK(net)}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="trend-legend-row">
        <span className="trend-legend-item">
          <span className="trend-dot-sq income-sq" />{t(lang, 'total_income')}
        </span>
        <span className="trend-legend-item">
          <span className="trend-dot-sq expense-sq" />{t(lang, 'total_expenses')}
        </span>
      </div>
    </div>
  )
}

function InsightsBlock({ insights, fmt, lang, catMap }) {
  if (!insights) return null
  const { biggest, topDay, weekendTotal, weekdayTotal } = insights
  const total = weekendTotal + weekdayTotal
  const weekendPct = total > 0 ? Math.round(weekendTotal / total * 100) : 0
  const weekdayPct = 100 - weekendPct

  const topDayDate = topDay ? new Date(topDay[0] + 'T12:00:00') : null
  const topDayLabel = topDayDate
    ? topDayDate.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short' })
    : null

  const biggestCatName = biggest?.categoria_id ? (catMap?.get(biggest.categoria_id) ?? '') : ''

  return (
    <div className="insights-grid">
      {biggest && (
        <div className="insight-card">
          <span className="insight-icon" aria-hidden="true">🔝</span>
          <span className="insight-val">{fmt(Number(biggest.importe))}</span>
          <span className="insight-label">
            {biggest.concepto || biggestCatName || (lang === 'es' ? 'mayor gasto' : 'top expense')}
          </span>
        </div>
      )}
      {topDay && topDay[1] > 0 && (
        <div className="insight-card">
          <span className="insight-icon" aria-hidden="true">📅</span>
          <span className="insight-val">{fmt(topDay[1])}</span>
          <span className="insight-label">{topDayLabel}</span>
        </div>
      )}
      {total > 0 && (
        <div className="insight-card insight-card-wide">
          <span className="insight-icon" aria-hidden="true">📊</span>
          <div className="insight-split-bars">
            <div className="insight-split-bar" style={{ width: `${weekdayPct}%`, background: 'var(--accent)' }} />
            <div className="insight-split-bar" style={{ width: `${weekendPct}%`, background: 'var(--expense)' }} />
          </div>
          <span className="insight-label">
            {lang === 'es'
              ? `L–V ${weekdayPct}% · F–D ${weekendPct}%`
              : `Mon–Fri ${weekdayPct}% · Sat–Sun ${weekendPct}%`}
          </span>
        </div>
      )}
    </div>
  )
}

function SpendingCalendar({ byDay, anio, mes, lang, fmt, onSelectDate, selectedDate }) {
  const daysInMonth = new Date(anio, mes, 0).getDate()
  const firstDow = new Date(anio, mes - 1, 1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const values = Object.values(byDay).filter(v => v > 0)
  const maxSpend = values.length > 0 ? Math.max(...values) : 1
  const DOW = lang === 'es' ? ['L','M','X','J','V','S','D'] : ['M','T','W','T','F','S','S']

  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${anio}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ d, dateStr, spend: byDay[dateStr] ?? 0 })
  }

  return (
    <div className="spend-cal">
      <div className="spend-cal-dow" aria-hidden="true">
        {DOW.map((l, i) => <span key={i} className="spend-cal-dow-lbl">{l}</span>)}
      </div>
      <div className="spend-cal-grid">
        {cells.map((cell, i) => {
          if (!cell) return <span key={`e${i}`} className="spend-cal-empty" aria-hidden="true" />
          const heat = cell.spend > 0 ? Math.max(1, Math.ceil(cell.spend / maxSpend * 5)) : 0
          const sel = selectedDate === cell.dateStr
          return (
            <button
              key={cell.d}
              className={`spend-cal-day heat-${heat}${sel ? ' spend-cal-sel' : ''}`}
              onClick={() => onSelectDate?.(sel ? null : cell.dateStr)}
              title={cell.spend > 0 ? fmt(cell.spend) : String(cell.d)}
              aria-label={`${cell.dateStr}${cell.spend > 0 ? ': ' + fmt(cell.spend) : ''}`}
              aria-pressed={sel}
            >
              {cell.d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function GraficasMes({ lang, gastoPorCat, categorias, trendData, fmt, onSelectCat, catColors, catMap, insights, selectedCatId, spendingByDay, anio, mes, onSelectDate, selectedDate }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sec_charts_collapsed') === '1')
  function toggleCollapsed() {
    setCollapsed(v => { localStorage.setItem('sec_charts_collapsed', v ? '' : '1'); return !v })
  }
  const pieData = categorias
    .filter(c => c.tipo === 'gasto' && (gastoPorCat[c.id] ?? 0) > 0)
    .map((c, i) => ({
      name: c.nombre,
      value: gastoPorCat[c.id],
      catId: c.id,
      color: catColors?.[c.id] ?? PALETTE[i % PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value)

  const hasTrend = trendData.some(d => d.income > 0 || d.expenses > 0)
  const hasCal = spendingByDay && Object.values(spendingByDay).some(v => v > 0) && anio && mes

  if (pieData.length === 0 && !hasTrend && !insights && !hasCal) return null

  return (
    <section className="section section-charts">
      <div className="section-header">
        <h2 className="section-title">{t(lang, 'charts_section')}</h2>
        <button
          className="btn-icon section-collapse-btn"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          title={collapsed ? (lang === 'es' ? 'Mostrar sección' : 'Show section') : (lang === 'es' ? 'Plegar sección' : 'Collapse section')}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </div>

      {!collapsed && <>

      {insights && (
        <div className="chart-block">
          <p className="chart-subtitle">{lang === 'es' ? 'Puntos clave' : 'Key insights'}</p>
          <InsightsBlock insights={insights} fmt={fmt} lang={lang} catMap={catMap} />
        </div>
      )}

      {pieData.length > 0 && (
        <div className={`chart-block${insights ? ' chart-block-sep' : ''}`}>
          <p className="chart-subtitle">{t(lang, 'spending_by_category')}</p>
          <DonutChart slices={pieData} fmt={fmt} lang={lang} onSelectCat={onSelectCat} selectedCatId={selectedCatId} />
        </div>
      )}

      {hasCal && (
        <div className={`chart-block${pieData.length > 0 || insights ? ' chart-block-sep' : ''}`}>
          <p className="chart-subtitle">{lang === 'es' ? 'Gasto por día' : 'Daily spending'}</p>
          <SpendingCalendar
            byDay={spendingByDay}
            anio={anio}
            mes={mes}
            lang={lang}
            fmt={fmt}
            onSelectDate={onSelectDate}
            selectedDate={selectedDate}
          />
          {selectedDate && (
            <button
              className="spend-cal-clear-btn"
              onClick={() => onSelectDate?.(null)}
            >
              × {lang === 'es' ? 'limpiar filtro de fecha' : 'clear date filter'}
            </button>
          )}
        </div>
      )}

      {hasTrend && (
        <div className={`chart-block${pieData.length > 0 || insights || hasCal ? ' chart-block-sep' : ''}`}>
          <p className="chart-subtitle">{t(lang, 'monthly_trend')}</p>
          <TrendBars data={trendData} fmt={fmt} lang={lang} />
        </div>
      )}
      </>}
    </section>
  )
}
