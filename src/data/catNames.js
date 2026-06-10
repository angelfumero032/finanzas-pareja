// Traducción de nombres de categorías/subcategorías para la vista.
// Los datos en BD no se tocan: esto solo cambia lo que se muestra.
// Si un nombre no está en el diccionario, se muestra tal cual.

const ES_EN = {
  // Categorías de gasto (seeds básica y rica)
  'comida': 'Food',
  'supermercado': 'Groceries',
  'alimentación': 'Groceries',
  'vivienda': 'Housing',
  'alquiler': 'Rent',
  'hipoteca': 'Mortgage',
  'hogar': 'Home',
  'transporte': 'Transport',
  'coche': 'Car',
  'gasolina': 'Fuel',
  'ocio': 'Leisure',
  'restaurantes': 'Restaurants',
  'bares': 'Bars',
  'salud': 'Health',
  'farmacia': 'Pharmacy',
  'ropa': 'Clothing',
  'suscripciones': 'Subscriptions',
  'regalos': 'Gifts',
  'mascotas': 'Pets',
  'viajes': 'Travel',
  'educación': 'Education',
  'formación': 'Training',
  'seguros': 'Insurance',
  'impuestos': 'Taxes',
  'otros': 'Other',
  'otros gastos': 'Other expenses',
  'ahorro': 'Savings',
  'belleza': 'Beauty',
  'gimnasio': 'Gym',
  'deporte': 'Sports',
  'tecnología': 'Tech',
  'niños': 'Kids',
  'bebé': 'Baby',
  'caprichos': 'Treats',
  // Subcategorías frecuentes
  'luz': 'Electricity',
  'agua': 'Water',
  'gas': 'Gas',
  'internet': 'Internet',
  'teléfono': 'Phone',
  'móvil': 'Mobile',
  'comunidad': 'HOA fees',
  'mantenimiento': 'Maintenance',
  'parking': 'Parking',
  'transporte público': 'Public transport',
  'taxi': 'Taxi',
  'peajes': 'Tolls',
  'cine': 'Cinema',
  'conciertos': 'Concerts',
  'libros': 'Books',
  'videojuegos': 'Video games',
  'streaming': 'Streaming',
  'música': 'Music',
  'café': 'Coffee',
  'comida a domicilio': 'Food delivery',
  'médico': 'Doctor',
  'dentista': 'Dentist',
  'óptica': 'Optician',
  'peluquería': 'Hairdresser',
  'limpieza': 'Cleaning',
  'muebles': 'Furniture',
  'electrodomésticos': 'Appliances',
  'vuelos': 'Flights',
  'hoteles': 'Hotels',
  'veterinario': 'Vet',
  'pienso': 'Pet food',
  // Categorías de ingreso
  'nómina': 'Salary',
  'sueldo': 'Salary',
  'ingresos extra': 'Extra income',
  'extras': 'Extras',
  'ventas': 'Sales',
  'devoluciones': 'Refunds',
  'intereses': 'Interest',
  'inversiones': 'Investments',
  'regalos recibidos': 'Gifts received',
}

const EN_ES = Object.fromEntries(Object.entries(ES_EN).map(([es, en]) => [en.toLowerCase(), es]))

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Devuelve el nombre traducido al idioma de la vista (o el original si no se conoce)
export function trCat(nombre, lang) {
  if (!nombre) return nombre
  const key = nombre.trim().toLowerCase()
  if (lang === 'en') {
    return ES_EN[key] ?? nombre
  }
  // lang === 'es': si el nombre está en inglés conocido, devolver el español
  const es = EN_ES[key]
  return es ? capitalize(es) : nombre
}
