import { useEffect } from 'react'

// Guía rápida, en lenguaje llano. Sin tecnicismos.
export default function GuiaModal({ open, onClose, lang, onShowShortcuts }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const es = lang === 'es'

  const items = es ? [
    ['💶', 'Apuntad cada gasto', 'Pulsad el botón + (abajo a la derecha) cada vez que gastéis algo. Veinte segundos y listo. Los dos veis lo mismo al instante.'],
    ['🎯', 'Poned límites por categoría', 'En "Por categoría", tocad "Sin presupuesto" y poned cuánto queréis gastar como máximo. La barra os avisa: verde bien, ámbar cuidado, rojo pasados.'],
    ['✨', 'Atajos que ayudan', '"Sugerir" crea los límites por vosotros con la media de los últimos meses. "Copiar mes anterior" repite los del mes pasado. Y si os pasáis en algo, "cubrir" mueve presupuesto de donde sobra.'],
    ['🐷', 'La hucha es vuestro ahorro', 'Cuando sobre dinero, pulsad "+ Aportar" y guardadlo. Podéis crear objetivos (vacaciones, un capricho) y ver cuánto os falta. Nada se mueve solo: decidís vosotros.'],
    ['↺', 'Los fijos se apuntan solos', 'Definid una vez los gastos que se repiten (alquiler, luz…) en el icono ↺. Cada mes aparecen como "Pendiente" y los confirmáis con "✓ Pagado".'],
    ['🔍', 'Encontrad cualquier cosa', 'La lupa busca en todos los meses: por nombre, importe o categoría. "¿Cuándo pagamos el seguro?" → dos toques.'],
    ['📱', 'Lleváosla en el móvil', 'Instaladla desde el enlace de abajo ("Instalar como app") y se actualizará sola. Las secciones se pliegan (▾) y se reordenan (↑↓) a vuestro gusto.'],
    ['📆', 'Vista del año de un vistazo', 'Desplegad "Año" (botón arriba a la derecha) para ver todos los meses: ingresos, gastos y si estuvisteis dentro del presupuesto. Ideal para la revisión trimestral.'],
    ['🔔', 'Actividad de vuestra pareja', 'El icono 🕐 muestra qué ha apuntado tu pareja en tiempo real. También podéis añadir una nota al mes ("Vacaciones", "Mes caro") para recordar el contexto.'],
  ] : [
    ['💶', 'Log every expense', 'Tap the + button (bottom right) whenever you spend. Twenty seconds. You both see the same data instantly.'],
    ['🎯', 'Set limits per category', 'In "By category", tap "No budget" and set a monthly cap. The bar warns you: green fine, amber careful, red over.'],
    ['✨', 'Helpful shortcuts', '"Suggest" creates limits from your last months\' average. "Copy from last month" repeats last month\'s. If you overspend, "cover" moves budget from where there\'s slack.'],
    ['🐷', 'The pot is your savings', 'When money is left over, tap "+ Add to pot". Create goals (holidays, a treat) and track progress. Nothing moves automatically: you decide.'],
    ['↺', 'Fixed expenses log themselves', 'Define recurring expenses once (rent, power…) under ↺. Each month they appear as "Pending" and you confirm with "✓ Paid".'],
    ['🔍', 'Find anything', 'The magnifier searches all months: by name, amount or category.'],
    ['📱', 'Take it on your phone', 'Install it from the link below ("Install as app") and it updates itself. Sections collapse (▾) and reorder (↑↓) to your liking.'],
    ['📆', 'Year at a glance', 'Expand "Year" (top-right button) to see all months: income, expenses and whether you stayed within budget. Great for a quarterly review.'],
    ['🔔', 'Partner activity', 'The 🕐 icon shows what your partner has logged in real time. You can also add a month note ("Holiday", "Expensive month") to remember the context.'],
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card guia-card" role="dialog" aria-modal="true" aria-labelledby="guia-modal-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="guia-modal-title" className="modal-title">{es ? 'Cómo funciona' : 'How it works'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label={es ? 'Cerrar' : 'Close'}>✕</button>
        </div>
        <div className="guia-list">
          {items.map(([icon, title, body]) => (
            <div key={title} className="guia-item">
              <span className="guia-icon" aria-hidden="true">{icon}</span>
              <div className="guia-text">
                <p className="guia-title">{title}</p>
                <p className="guia-body">{body}</p>
              </div>
            </div>
          ))}
        </div>
        {onShowShortcuts && (
          <button className="tool-chip guia-shortcuts-btn" onClick={() => { onClose(); onShowShortcuts() }}>
            ⌨ {es ? 'Atajos de teclado' : 'Keyboard shortcuts'}
          </button>
        )}
      </div>
    </div>
  )
}
