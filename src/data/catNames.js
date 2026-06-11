// Traducción de nombres de categorías/subcategorías para la vista.
// Los datos en BD no se tocan: esto solo cambia lo que se muestra.
// Si un nombre no está en el diccionario, se muestra tal cual.

const ES_EN = {
  // ── Categorías principales ──
  'comida': 'Food',
  'alimentación': 'Food & Groceries',
  'vivienda': 'Housing',
  'transporte': 'Transport',
  'ocio': 'Leisure',
  'salud': 'Health',
  'suministros': 'Utilities',
  'compras': 'Shopping',
  'hogar': 'Home',
  'hogar & compras': 'Home & Shopping',
  'personal': 'Personal',
  'educación': 'Education',
  'mascotas': 'Pets',
  'viajes': 'Travel',
  'ahorro': 'Savings',
  'ahorro & inversiones': 'Savings & Investments',
  'inversiones': 'Investments',
  'otros gastos': 'Other expenses',
  'otros': 'Other',
  'belleza': 'Beauty',
  'tecnología': 'Tech',
  'niños': 'Kids',
  'bebé': 'Baby',
  'caprichos': 'Treats',
  'deporte': 'Sports',
  'deportes': 'Sports',
  'gimnasio': 'Gym',
  'ropa': 'Clothing',
  'suscripciones': 'Subscriptions',
  'regalos': 'Gifts',
  'seguros': 'Insurance',
  'impuestos': 'Taxes',
  'formación': 'Training',

  // ── Subcategorías de vivienda ──
  'alquiler': 'Rent',
  'hipoteca': 'Mortgage',
  'alquiler / hipoteca': 'Rent / Mortgage',
  'comunidad': 'HOA fees',
  'comunidad de vecinos': 'HOA fees',
  'seguro de hogar': 'Home insurance',
  'ibi / impuestos': 'Property tax',
  'reparaciones': 'Repairs',
  'mantenimiento': 'Maintenance',

  // ── Subcategorías de suministros ──
  'luz': 'Electricity',
  'electricidad': 'Electricity',
  'agua': 'Water',
  'gas': 'Gas',
  'internet': 'Internet',
  'teléfono': 'Phone',
  'móvil': 'Mobile',
  'teléfono móvil': 'Mobile phone',

  // ── Subcategorías de alimentación ──
  'supermercado': 'Supermarket',
  'mercado': 'Market',
  'restaurantes': 'Restaurants',
  'bares': 'Bars',
  'comida a domicilio': 'Food delivery',
  'cafeterías': 'Cafes',
  'café': 'Coffee',

  // ── Subcategorías de transporte ──
  'coche': 'Car',
  'gasolina': 'Fuel',
  'transporte público': 'Public transport',
  'parking': 'Parking',
  'parking / peajes': 'Parking / Tolls',
  'peajes': 'Tolls',
  'taxi': 'Taxi',
  'taxi / vtc': 'Taxi / Ride-sharing',
  'mantenimiento coche': 'Car maintenance',
  'seguro coche': 'Car insurance',

  // ── Subcategorías de salud ──
  'farmacia': 'Pharmacy',
  'farmacia personal': 'Personal pharmacy',
  'médico': 'Doctor',
  'médico privado': 'Private doctor',
  'dentista': 'Dentist',
  'seguro médico': 'Health insurance',
  'óptica': 'Optician',

  // ── Subcategorías de ocio ──
  'cine': 'Cinema',
  'cine / teatro / música': 'Cinema / Theatre / Music',
  'conciertos': 'Concerts',
  'libros': 'Books',
  'libros / medios': 'Books / Media',
  'videojuegos': 'Video games',
  'juegos': 'Games',
  'streaming': 'Streaming',
  'suscripciones streaming': 'Streaming subscriptions',
  'música': 'Music',
  'hobbies': 'Hobbies',

  // ── Subcategorías de personal / belleza ──
  'peluquería': 'Hairdresser',
  'peluquería / estética': 'Hair & Beauty',
  'gimnasio / fitness': 'Gym / Fitness',

  // ── Subcategorías de hogar / compras ──
  'limpieza': 'Cleaning',
  'limpieza / droguería': 'Cleaning / Toiletries',
  'muebles': 'Furniture',
  'muebles / decoración': 'Furniture / Décor',
  'electrodomésticos': 'Appliances',
  'ropa / zapatos': 'Clothing / Shoes',

  // ── Subcategorías de viajes ──
  'vuelos': 'Flights',
  'hoteles': 'Hotels',
  'alojamiento': 'Accommodation',
  'comida viaje': 'Travel meals',

  // ── Subcategorías de educación ──
  'cursos / formación': 'Courses / Training',
  'material / libros': 'Materials / Books',
  'matrícula / cuotas': 'Tuition / Fees',
  'actividades': 'Activities',

  // ── Subcategorías de mascotas ──
  'veterinario': 'Vet',
  'pienso': 'Pet food',
  'seguro mascota': 'Pet insurance',
  'comida / higiene': 'Food / Hygiene',

  // ── Subcategorías de ahorro / inversiones ──
  'fondo emergencia': 'Emergency fund',
  'plan de pensiones': 'Pension plan',

  // ── Categorías y subcategorías de ingreso ──
  'nómina': 'Salary',
  'sueldo': 'Salary',
  'ingresos extra': 'Extra income',
  'otros ingresos': 'Other income',
  'extras': 'Extras',
  'ventas': 'Sales',
  'devoluciones': 'Refunds',
  'intereses': 'Interest',
  'regalos recibidos': 'Gifts received',
  'trabajo freelance': 'Freelance',
  'alquiler recibido': 'Rental income',
  // ── Categorías completas de migración 009 (faltaban en ES_EN) ──
  'ocio y entretenimiento': 'Entertainment',
  'ropa y calzado': 'Clothing & Footwear',
  'cuidado personal': 'Personal care',
  'gastos inesperados': 'Unexpected expenses',
  'gastos extra programados': 'Scheduled extras',
  'educación y formación': 'Education & Training',
  'trabajo y negocio': 'Work & Business',
  // ── Subcategorías de migración 009 ──
  'médico / dentista': 'Doctor / Dentist',
  'salidas y bares': 'Bars & Outings',
  'cine / espectáculos': 'Cinema / Shows',
  'libros y cultura': 'Books & Culture',
  'streaming (netflix, etc.)': 'Streaming (Netflix, etc.)',
  'música (spotify, etc.)': 'Music (Spotify, etc.)',
  'apps y software': 'Apps & Software',
  'almacenamiento en la nube': 'Cloud storage',
  'periódicos y revistas': 'Newspapers & Magazines',
  'cosmética y cuidado': 'Beauty & Care',
  'depilación / estética': 'Hair removal / Aesthetics',
  'multas': 'Fines',
  'médico urgente': 'Emergency medical',
  'vacaciones': 'Holidays',
  'navidad': 'Christmas',
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
