// Biblioteca estática de conceptos frecuentes, keyed por nombre de categoría en minúsculas.
// Se usa como base del datalist y los chips de sugerencia en MovimientoModal.
// Normalización: catName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')

export const CONCEPTOS = {
  vivienda:       ['Alquiler/Hipoteca', 'Comunidad', 'Seguro hogar', 'Reparación/Mantenimiento', 'Limpieza hogar', 'Jardín/Piscina'],
  suministros:    ['Luz', 'Agua', 'Gas', 'Internet', 'Móvil', 'Seguro vida', 'TV/Plataformas'],
  comida:         ['Compra súper', 'Mercadona', 'Lidl/Aldi', 'Restaurante', 'Café/Cafetería', 'Comida a domicilio', 'Frutería/Mercado'],
  transporte:     ['Gasolina', 'Parking', 'Bus/Metro/Tren', 'Taxi/Uber/Cabify', 'Peaje', 'ITV/Revisión', 'Seguro coche'],
  salud:          ['Farmacia', 'Médico/Especialista', 'Dentista', 'Gimnasio', 'Óptica', 'Psicólogo', 'Parafarmacia'],
  ocio:           ['Cine/Teatro/Concierto', 'Netflix/HBO/Disney', 'Spotify/Música', 'Viaje/Escapada', 'Hobby/Afición', 'Deporte', 'Bares/Copas'],
  compras:        ['Ropa', 'Calzado', 'Hogar/Decoración', 'Tecnología/Gadgets', 'Regalo', 'Librería/Papelería', 'Cosmética'],
  mascotas:       ['Veterinario', 'Comida mascota', 'Peluquería mascota', 'Accesorios mascota', 'Seguro mascota'],
  educacion:      ['Curso/Formación', 'Libros/Ebooks', 'Material escolar', 'Idiomas', 'Universidad/Máster'],
  hijos:          ['Guardería/Colegio', 'Ropa hijos', 'Actividades extraescolares', 'Juguetes/Material', 'Médico pediátrico'],
  imprevistos:    ['Multa', 'Avería vehículo', 'Urgencia médica', 'Reparación urgente', 'Pérdida/Robo'],
  ahorro:         ['Ahorro mensual', 'Fondo emergencia', 'Plan de pensiones', 'Inversión'],
  personal:       ['Peluquería/Barbería', 'Spa/Masaje', 'Ropa personal', 'Cuidado personal'],
  nomina:         ['Nómina mensual', 'Paga extra junio', 'Paga extra diciembre'],
  'extra/bonus':  ['Bonus empresa', 'Comisión/Variable', 'Premio', 'Horas extra'],
  'otros ingresos': ['Transferencia recibida', 'Reembolso/Devolución', 'Alquiler cobrado', 'Venta artículo', 'Dividendos'],
}

const strip = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function getConceptosByCatName(catName) {
  if (!catName) return []
  const key = strip(catName)
  if (CONCEPTOS[key]) return CONCEPTOS[key]
  // búsqueda parcial si no hay match exacto
  const found = Object.keys(CONCEPTOS).find(k => key.includes(k) || k.includes(key))
  return found ? CONCEPTOS[found] : []
}
