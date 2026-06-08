# finanzas-pareja

App web (PWA) para que dos personas lleven sus **finanzas mensuales compartidas**:
ingresos, gastos, categorías/subcategorías, presupuesto por mes, balance — online,
sincronizado en tiempo real y con aviso al otro de cada cambio.

- **Stack:** Vite + React (PWA) · Supabase (Postgres + Auth + Realtime) · Netlify · coste 0 €.
- **Acceso:** 2 usuarios con login, sin registro público. Datos 100 % compartidos; RLS cierra el acceso a terceros.
- **Idioma:** por usuario (ES/EN), ES por defecto. **Moneda:** €.
- Plan maestro y estado: `01_Proyectos/Personal/finanzas-pareja/` en el disco AF-Claude-T7.

> Estado: **Etapa 3 completa** — login, vista de mes, CRUD, presupuestos, Realtime, campana de actividad, toggle de idioma. Build OK (67 módulos, 116 ms). Pendiente: `schema.sql` + `seed.sql` en Supabase (si no aplicados), luego deploy (Etapa 4).

## Arranque local

```bash
npm install
cp .env.example .env.local   # rellena las claves de Supabase (abajo)
npm run dev
```

Scripts: `npm run dev` · `npm run build` · `npm run preview` · `npm run lint`.

## Requisito previo: Supabase

Si no está hecho todavía, aplica el esquema y los datos iniciales:

1. **Auth → Sign In / Providers:** Email activado; **desactiva «Allow new users to sign up»**.
2. **Auth → Users → Add user** dos veces (email + contraseña de cada persona). Copia los `User UID`.
3. **SQL Editor:** pega y ejecuta `supabase/schema.sql`. Luego edita `supabase/seed.sql`
   (ya tiene los UID reales de Ángel y pareja), verifica emails/nombres y ejecútalo.
4. **Project Settings → API:** copia `Project URL` y la clave `anon public` a `.env.local`:

   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. **Database → Replication:** confirma que `actividad` y `movimientos` están en `supabase_realtime`
   (el `schema.sql` ya lo hace vía `alter publication`).

## Deploy (Etapa 4)

```bash
# 1. Repo privado en GitHub (una vez)
git remote add origin git@github.com:TU-USUARIO/finanzas-pareja.git
git push -u origin main

# 2. Netlify → Add new site → Import from Git
#    Build command:  npm run build
#    Publish dir:    dist
#    Env vars:       VITE_SUPABASE_URL  /  VITE_SUPABASE_ANON_KEY

# 3. Supabase → Auth → URL Configuration
#    Site URL:           https://TU-APP.netlify.app
#    Redirect URLs:      https://TU-APP.netlify.app/**
```

## Seguridad

- **Nunca** subas claves al repo: `.env.local` está en `.gitignore`. Usa `.env.example` como plantilla.
- En el frontend solo va la clave **anon** (pública por diseño); la `service_role` nunca se usa aquí.
- Las variables en Netlify van en el panel, no en el repo.

## Estructura

```
src/
  lib/supabaseClient.js           # cliente Supabase
  context/AuthContext.jsx         # sesión + perfil del usuario
  context/LangContext.jsx         # idioma por usuario (ES/EN), persistido en DB
  i18n.js                         # traducciones + MONTHS + timeAgo
  pages/
    LoginPage.jsx                 # login email+contraseña, sin registro
    MesView.jsx                   # vista principal: cabecera, resumen, categorías, movimientos
  components/
    MovimientoModal.jsx           # modal añadir/editar/eliminar movimiento
    ActivityPanel.jsx             # panel lateral de actividad reciente + campana
  App.jsx                         # raíz: AuthProvider → AppInner → LangProvider → MesView
  App.css                         # todos los estilos (custom properties, responsive)
  index.css                       # reset mínimo
supabase/
  schema.sql                      # 8 tablas + RLS (mi_hogar()) + triggers actividad + Realtime
  seed.sql                        # hogar + 2 perfiles + categorías ES por defecto
```
