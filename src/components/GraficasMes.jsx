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
      return { fullCircle: true, color, name: sl.name, value: sl.value, pct }
    }

    const a0 = polar(CX, CY, R, start)
    const a1 = polar(CX, CY, R, end)
    const b0 = polar(CX, CY, ri, start)
    const b1 = polar(CX, CY, ri, end)
    const large = sweep > 180 ? 1 : 0
    return {
      d: `M${a0.x},${a0.y} A${R},${R} 0 ${large} 1 ${a1.x},${a1.y} L${b1.x},${b1.y} A${ri},${ri} 0 ${large} 0 ${b0.x},${b0.y} Z`,
      color, name: sl.name, value: sl.value, pct,
    }
  })

  const displayActive = selectedCatId != null
    ? segments.findIndex(s => s.catId === selectedCatId)
    : active

  const sel = displayActive !== null && displayActive !== -1 ? segments[displayActive] : null
  const centerTop = sel
    ? (sel.name.length > 11 ? sel.name.slice(0, 10) + '…' : sel.name)
    : t(lang, 'total_expenses')
  const centerBot = sel ? fmt(sel.value) : fmt(total)

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" className="donut-svg" role="img">
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
              style={{ cursor: 'pointer', transition: 'opacity .15s' }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => {
                const next = active === i ? null : i
                setActive(next)
                onSelectCat?.(next !== null ? seg.catId : null)
              }}
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

      <ul className="donut-legend">
        {segments.map((seg, i) => (
          <li
            key={i}
            className={`legend-item${displayActive === i ? ' legend-active' : ''}`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => {
              const next = active === i ? null : i
              setActive(next)
              onSelectCat?.(next !== null ? seg.catId : null)
            }}
          >
            <span className="legend-dot" style={{ background: seg.color }} />
            <span className="legend-name">{seg.name}</span>
            <span className="legend-val">{fmt(seg.value)}</span>
            <span className="legend-pct">{(seg.pct * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TrendBars({ data, fmt, lang }) {
  const [activeCol, setActiveCol] = useState(null)
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1)
  const lastIdx = data.length - 1
  const sel = activeCol !== null ? data[activeCol] : null

  return (
    <div className="trend-wrap">
      {sel && (
        <div className="trend-tooltip">
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
        {data.map((d, i) => (
          <div
            key={i}
            className={`trend-col${i === lastIdx ? ' trend-col-current' : ''}${activeCol === i ? ' trend-col-active' : ''}`}
            onClick={() => setActiveCol(activeCol === i ? null : i)}
            style={{ cursor: 'pointer' }}
          >
            <div className="trend-bars-pair">
              <div
                className="trend-bar income-bar"
                style={{ height: `${(d.income / maxVal) * 100}%` }}
              />
              <div
                className="trend-bar expense-bar"
                style={{ height: `${(d.expenses / maxVal) * 100}%` }}
              />
            </div>
            <span className="trend-label">{d.label}</span>
          </div>
        ))}
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

export default function GraficasMes({ lang, gastoPorCat, categorias, trendData, fmt, onSelectCat, catColors, selectedCatId }) {
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

  if (pieData.length === 0 && !hasTrend) return null

  return (
    <section className="section section-charts">
      <h2 className="section-title">{t(lang, 'charts_section')}</h2>

      {pieData.length > 0 && (
        <div className="chart-block">
          <p className="chart-subtitle">{t(lang, 'spending_by_category')}</p>
          <DonutChart slices={pieData} fmt={fmt} lang={lang} onSelectCat={onSelectCat} selectedCatId={selectedCatId} />
        </div>
      )}

      {hasTrend && (
        <div className={`chart-block${pieData.length > 0 ? ' chart-block-sep' : ''}`}>
          <p className="chart-subtitle">{t(lang, 'monthly_trend')}</p>
          <TrendBars data={trendData} fmt={fmt} lang={lang} />
        </div>
      )}
    </section>
  )
}
