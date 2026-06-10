import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Auto-actualización: registra ya, recarga sola al activar un SW nuevo y
// comprueba si hay versión nueva cada 30 min mientras la app está abierta
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) setInterval(() => registration.update(), 30 * 60 * 1000)
  },
  onNeedRefresh() { updateSW(true) },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
