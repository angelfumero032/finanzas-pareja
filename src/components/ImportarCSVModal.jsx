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

function parseCSV(text, categorias) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const [headerLine, ...dataLines] = lines
  const sep = detectSep(headerLine)
  const cols = parseCSVRow(headerLine, sep).map(c => c.toLowerCase().replace(/[áàä]/g, 'a').replace(/[íìï]/g, 'i').replace(/[éèë]/g, 'e').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u'))
  const idx = {
    fecha: cols.findIndex(c => ['fecha', 'date'].includes(c)),
    tipo: cols.findIndex(c => ['tipo', 'type'].includes(c)),
    importe: cols.findIndex(c => ['importe', 'amount', 'cantidad'].includes(c)),
    categoria: cols.findIndex(c => ['categoria', 'category'].includes(c)),
    subcategoria: cols.findIndex(c => ['subcategoria', 'subcategory'].includes(c)),
    nota: cols.findIndex(c => ['nota', 'note', 'descripcion', 'description'].includes(c)),
  }

  const catByName = {}
  categorias.forEach(c => { catByName[c.nombre.toLowerCase()] = c.id })

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
    const nota = get('nota') || null

    const errors = []
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) errors.push('fecha')
    if (!tipo) errors.push('tipo')
    if (isNaN(importe) || importe <= 0) errors.push('importe')

    return {
      rowIdx,
      fecha,
      tipo,
      importe: isNaN(importe) ? 0 : importe,
      catNombre: get('categoria'),
      catId,
      nota,
      errors,
      valid: errors.length === 0,
    }
  }).filter(Boolean)
}

export default function ImportarCSVModal({ open, onClose, lang, hogarId, userId, categorias, anio, mes, onImported }) {
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) { setRows([]); setDone(null) }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const parsed = parseCSV(ev.target.result, categorias)
      setRows(parsed)
    }
    reader.readAsText(file, 'utf-8')
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
        nota: r.nota,
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
      <div className="modal-card import-modal-card">
        <div className="modal-header">
          <h2 className="modal-title">{lang === 'es' ? 'Importar CSV' : 'Import CSV'}</h2>
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
                  ? 'CSV con columnas: fecha (YYYY-MM-DD), tipo (gasto/ingreso), importe, categoria (opcional), nota (opcional).'
                  : 'CSV with columns: fecha (YYYY-MM-DD), tipo (gasto/income), importe, categoria (optional), nota (optional).'}
              </p>
              <p className="import-help-note">
                {lang === 'es'
                  ? `Los movimientos se importarán con su fecha original. La fecha del mes actual (${monthStr}) no se fuerza.`
                  : `Movements are imported with their original date. The current month (${monthStr}) is not forced.`}
              </p>
            </div>

            <div className="field">
              <label>{lang === 'es' ? 'Archivo CSV' : 'CSV file'}</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                style={{ fontSize: '0.9rem' }}
              />
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
                          <td className={r.errors.includes('importe') ? 'import-cell-err' : ''}>{r.importe > 0 ? r.importe.toFixed(2) : '—'}</td>
                          <td>{r.catNombre ? (r.catId ? r.catNombre : <span className="import-cat-warn">{r.catNombre} ⚠</span>) : '—'}</td>
                          <td>{r.nota || '—'}</td>
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
