import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_MB = 10

// Zona de archivos compartida del hogar (facturas, recibos, contratos…)
// Usa el bucket privado 'archivos' de Supabase Storage; cada hogar guarda
// en su carpeta `${hogarId}/` y la política de Storage limita el acceso.
export default function ArchivosHogar({ lang, hogarId, showToast }) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState(null) // null = aún no cargado
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)
  const es = lang === 'es'

  async function load() {
    const { data, error } = await supabase.storage.from('archivos')
      .list(hogarId, { sortBy: { column: 'created_at', order: 'desc' } })
    if (error) { setFiles([]); showToast(es ? 'Zona de archivos no disponible (¿migración 014 aplicada?)' : 'File area unavailable (migration 014 applied?)', 'error'); return }
    setFiles((data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder'))
  }

  function toggle() {
    setOpen(v => {
      const next = !v
      if (next && files === null) load()
      return next
    })
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast(es ? `Máximo ${MAX_MB} MB por archivo` : `Max ${MAX_MB} MB per file`, 'error')
      return
    }
    setBusy(true)
    try {
      const safeName = file.name.replace(/[^\w.\-()\s]/g, '_')
      const { error } = await supabase.storage.from('archivos')
        .upload(`${hogarId}/${Date.now()}_${safeName}`, file, { upsert: false })
      if (error) throw error
      showToast(es ? 'Archivo subido ✓' : 'File uploaded ✓')
      await load()
    } catch {
      showToast(es ? 'Error al subir el archivo' : 'Upload error', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleOpen(name) {
    const { data, error } = await supabase.storage.from('archivos')
      .createSignedUrl(`${hogarId}/${name}`, 3600)
    if (error || !data?.signedUrl) { showToast(es ? 'No se pudo abrir' : 'Could not open', 'error'); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function handleDelete(name) {
    if (!window.confirm(es ? `¿Eliminar "${displayName(name)}"?` : `Delete "${displayName(name)}"?`)) return
    const { error } = await supabase.storage.from('archivos').remove([`${hogarId}/${name}`])
    if (error) { showToast(es ? 'No se pudo eliminar' : 'Could not delete', 'error'); return }
    setFiles(prev => (prev ?? []).filter(f => f.name !== name))
    showToast(es ? 'Archivo eliminado' : 'File deleted')
  }

  function displayName(name) {
    return name.replace(/^\d{10,}_/, '')
  }

  function fmtSize(bytes) {
    if (!bytes) return ''
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
  }

  if (!hogarId) return null

  return (
    <div className="archivos-hogar">
      <button className="tool-chip" onClick={toggle} aria-expanded={open}>
        📎 {es ? 'Archivos del hogar' : 'Household files'} {open ? '▴' : '▾'}
      </button>
      {open && (
        <div className="archivos-panel">
          <button
            className="btn-sm btn-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? '…' : (es ? '⤴ Subir archivo' : '⤴ Upload file')}
          </button>
          <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
          {files === null && <p className="empty-text">{es ? 'Cargando…' : 'Loading…'}</p>}
          {files?.length === 0 && (
            <p className="empty-text">
              {es ? 'Sin archivos. Subid aquí facturas, recibos o contratos.' : 'No files yet. Upload invoices, receipts or contracts here.'}
            </p>
          )}
          {files?.map(f => (
            <div key={f.name} className="archivo-row">
              <button className="archivo-name" onClick={() => handleOpen(f.name)} title={es ? 'Abrir' : 'Open'}>
                {displayName(f.name)}
              </button>
              <span className="archivo-size">{fmtSize(f.metadata?.size)}</span>
              <button className="cat-row-action" onClick={() => handleDelete(f.name)} title={es ? 'Eliminar' : 'Delete'}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
