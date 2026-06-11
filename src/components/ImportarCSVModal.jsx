import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { t, MONTHS } from '../i18n'

function parseCSVRow(row, sep = ',') {
  const fields = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      if (inQ && row[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === sep && !inQ) {
      fields.push(cur.trim()); cur = ''
    } else { cur += ch }
  }
  fields.push(cur.trim())
  return fields
}

function detectSep(headerLine) {
  const commas = (headerLine.match(/,/g) ?? []).length
  const semis = (headerLine.match(/;/g) ?? []).length
  return semis > commas ? ';' : ','
}

function parseCSV(text, categorias, subcategorias = []) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const [headerLine, ...dataLines] = lines
  const sep = detectSep(headerLine)
  const cols = parseCSVRow(headerLine, sep).map(c => c.toLowerCase().replace(/[áàä]/g, 'a').replace(/[íìï]/g, 'i').replace(/[éèë]/g, 'e').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u'))
  const idx = {
    fecha: cols.findIndex(c => ['fecha', 'date'].includes(c)),
    tipo: cols.findIndex(c => ['tipo', 'type'].includes(c)),
    concepto: cols.findIndex(c => ['concepto', 'concept', 'descripcion', 'description'].includes(c)),
    importe: cols.findIndex(c => ['importe', 'amount', 'cantidad'].includes(c)),
    categoria: cols.findIndex(c => ['categoria', 'category'].includes(c)),
    subcategoria: cols.findIndex(c => ['subcategoria', 'subcategory'].includes(c)),
    fijo: cols.findIndex(c => ['fijo', 'fixed', 'es_fijo'].includes(c)),
    pendiente: cols.findIndex(c => ['pendiente', 'pending'].includes(c)),
    nota: cols.findIndex(c => ['nota', 'note'].includes(c)),
    metodo_pago: cols.findIndex(c => ['metodo_pago', 'payment_method', 'metodo', 'pago'].includes(c)),
  }

  const catByName = {}
  categorias.forEach(c => { catByName[c.nombre.toLowerCase()] = c.id })
  // Índice: "catId::subcatNombre" → subcatId
  const subcatsByName = {}
  subcategorias.forEach(s => {
    subcatsByName[`${s.categoria_id}::${s.nombre.toLowerCase()}`] = s.id
  })

  return dataLines.map((line, rowIdx) => {
    if (!line.trim()) return null
    const vals = parseCSVRow(line, sep)
    const get = (k) => idx[k] >= 0 ? (vals[idx[k]] ?? '').trim() : ''
    const fecha = get('fecha')
    const tipoRaw = get('tipo').toLowerCase()
    const tipo = ['gasto', 'expense', 'exp'].includes(tipoRaw) ? 'gasto'
      : ['ingreso', 'income', 'inc'].includes(tipoRaw) ? 'ingreso' : null
    const rawImporte = get('importe')
    const importeStr = sep === ';'
      ? rawImporte.replace(/\./g, '').replace(',', '.')
      : rawImporte.replace(',', '.')
    const importe = parseFloat(importeStr)
    const catNombre = get('categoria').toLowerCase()
    const catId = catByName[catNombre] ?? null
    const subcatNombre = get('subcategoria').toLowerCase()
    const subcatId = catId && subcatNombre ? (subcatsByName[`${catId}::${subcatNombre}`] ?? null) : null
    const metodoPago = (() => {
      const mp = get('metodo_pago').toLowerCase()
      return ['tarjeta', 'efectivo', 'transferencia', 'bizum'].includes(mp) ? mp : 'tarjeta'
    })()
    const nota = get('nota') || null
    const concepto = get('concepto') || null
    const esFijo = ['1', 'true', 'si', 'yes', 'sí'].includes(get('fijo').toLowerCase())
    const pendiente = ['1', 'true', 'si', 'yes', 'sí'].includes(get('pendiente').toLowerCase())

    const errors = []
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || isNaN(Date.parse(fecha))) errors.push('fecha')
    if (!tipo) errors.push('tipo')
    if (isNaN(importe) || importe <= 0) errors.push('importe')

    return {
      rowIdx,
      fecha,
      tipo,
      importe: isNaN(importe) ? 0 : importe,
      catNombre: get('categoria'),
      catId,
      subcatId,
      metodoPago,
      concepto,
      nota,
      esFijo,
      pendiente,
      errors,
      valid: errors.length === 0,
    }
  }).filter(Boolean)
}

export default function ImportarCSVModal({ open, onClose, lang, hogarId, userId, categorias, subcategorias = [], anio, mes, onImported }) {
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) { setRows([]); setDone(null); setDragOver(false) }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function readFile(file) {
    if (!file || !file.name.match(/\.csv$/i)) return
    const reader = new FileReader()
    reader.onload = ev => {
      const parsed = parseCSV(ev.target.result, categorias, subcategorias)
      setRows(parsed)
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleFile(e) {
    readFile(e.target.files?.[0])
  }

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

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    readFile(file)
  }

  async function handleImport() {
    const valid = rows.filter(r => r.valid)
    if (!valid.length) return
    setImporting(true)
    try {
      const inserts = valid.map(r => ({
        hogar_id: hogarId,
        creado_por: userId,
        tipo: r.tipo,
        importe: r.importe,
        fecha: r.fecha,
        categoria_id: r.catId,
        subcategoria_id: r.subcatId ?? null,
        metodo_pago: r.metodoPago ?? 'tarjeta',
        concepto: r.concepto || null,
        nota: r.nota,
        es_fijo: r.tipo === 'gasto' ? r.esFijo : false,
        pendiente: r.tipo === 'gasto' ? r.pendiente : false,
      }))
      const { error } = await supabase.from('movimientos').insert(inserts)
      if (error) throw error
      setDone(valid.length)
      onImported(valid.length)
    } catch {
      setDone(-1)
    } finally {
      setImporting(false)
    }
  }

  const validRows = rows.filter(r => r.valid)
  const invalidRows = rows.filter(r => !r.valid)
  const monthStr = `${MONTHS[lang][mes - 1]} ${anio}`

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card import-modal-card" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
        <div className="modal-header">
          <h2 id="import-modal-title" className="modal-title">{lang === 'es' ? 'Importar CSV' : 'Import CSV'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label={t(lang, 'close')}>✕</button>
        </div>

        {done !== null ? (
          <div className="import-result">
            {done >= 0 ? (
              <p className="import-result-ok">
                {done} {lang === 'es' ? `movimiento(s) importado(s) en ${monthStr}` : `movement(s) imported to ${monthStr}`}
              </p>
            ) : (
              <p className="import-result-err">{t(lang, 'save_error')}</p>
            )}
            <button className="btn-secondary" onClick={onClose}>{t(lang, 'close')}</button>
          </div>
        ) : (
          <>
            <div className="import-help">
              <p className="import-help-text">
                {lang === 'es'
                  ? 'CSV con columnas: fecha (YYYY-MM-DD), tipo (gasto/ingreso), concepto, importe, categoria, subcategoria, fijo (0/1), pendiente (0/1), metodo_pago (tarjeta/efectivo/transferencia/bizum), nota — todas opcionales excepto fecha, tipo e importe.'
                  : 'CSV columns: fecha (YYYY-MM-DD), tipo (gasto/ingreso), concepto, importe, categoria, subcategoria, fijo (0/1), pendiente (0/1), metodo_pago (tarjeta/efectivo/transferencia/bizum), nota — only fecha, tipo and importe are required.'}
              </p>
              <p className="import-help-note">
                {lang === 'es'
                  ? `Los movimientos se importarán con su fecha original. La fecha del mes actual (${monthStr}) no se fuerza.`
                  : `Movements are imported with their original date. The current month (${monthStr}) is not forced.`}
              </p>
              <button type="button" className="btn-sm btn-ghost" onClick={downloadTemplate}>
                ⬇ {lang === 'es' ? 'Descargar plantilla' : 'Download template'}
              </button>
            </div>

            <div
              className={`csv-drop-zone${dragOver ? ' csv-drop-active' : ''}${rows.length > 0 ? ' csv-drop-loaded' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label={lang === 'es' ? 'Área de arrastre de CSV' : 'CSV drop area'}
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              {rows.length > 0 ? (
                <span className="csv-drop-label csv-drop-done">
                  ✓ {validRows.length + invalidRows.length} {lang === 'es' ? 'filas cargadas' : 'rows loaded'}
                  <span className="csv-drop-change">{lang === 'es' ? ' · cambiar' : ' · change'}</span>
                </span>
              ) : (
                <>
                  <span className="csv-drop-icon" aria-hidden="true">📂</span>
                  <span className="csv-drop-label">
                    {dragOver
                      ? (lang === 'es' ? 'Suelta el archivo' : 'Drop the file')
                      : (lang === 'es' ? 'Arrastra un CSV aquí o haz clic' : 'Drag a CSV here or click to browse')}
                  </span>
                </>
              )}
            </div>

            {rows.length > 0 && (
              <div className="import-preview">
                <p className="import-preview-title">
                  {lang === 'es'
                    ? `${validRows.length} válido(s), ${invalidRows.length} con error`
                    : `${validRows.length} valid, ${invalidRows.length} with errors`}
                </p>
                <div className="import-table-wrap">
                  <table className="import-table">
                    <thead>
                      <tr>
                        <th>{lang === 'es' ? 'Fecha' : 'Date'}</th>
                        <th>{lang === 'es' ? 'Tipo' : 'Type'}</th>
                        <th>{lang === 'es' ? 'Concepto' : 'Description'}</th>
                        <th>{lang === 'es' ? 'Importe' : 'Amount'}</th>
                        <th>{lang === 'es' ? 'Categoría' : 'Category'}</th>
                        <th>{lang === 'es' ? 'Nota' : 'Note'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.rowIdx} className={r.valid ? (r.catId ? '' : 'import-row-warn') : 'import-row-err'}>
                          <td className={r.errors.includes('fecha') ? 'import-cell-err' : ''}>{r.fecha || '—'}</td>
                          <td className={r.errors.includes('tipo') ? 'import-cell-err' : ''}>{r.tipo || '—'}</td>
                          <td className="import-concepto">{r.concepto || <span style={{ opacity: 0.4 }}>—</span>}</td>
                          <td className={r.errors.includes('importe') ? 'import-cell-err' : ''}>{r.importe > 0 ? r.importe.toFixed(2) : '—'}</td>
                          <td>{r.catNombre ? (r.catId ? r.catNombre : <span className="import-cat-warn">{r.catNombre} ⚠</span>) : '—'}</td>
                          <td>{r.nota || <span style={{ opacity: 0.4 }}>—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>{t(lang, 'cancel')}</button>
              {validRows.length > 0 && (
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? '…' : (lang === 'es' ? `Importar ${validRows.length}` : `Import ${validRows.length}`)}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
