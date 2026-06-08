# finanzas-pareja

App web (PWA) para que dos personas lleven sus **finanzas mensuales compartidas**:
ingresos, gastos, categorías/subcategorías, presupuesto por mes, balance — online,
sincronizado en tiempo real y con aviso al otro de cada cambio.

- **Stack:** Vite + React (PWA) · Supabase (Postgres + Auth + Realtime) · Netlify · coste 0 €.
- **Acceso:** 2 usuarios con login, sin registro público. Datos 100 % compartidos; RLS cierra el acceso a terceros.
- **Idioma:** por usuario (ES/EN), ES por defecto. **Moneda:** €.
- Plan maestro y estado: `01_Proyectos/Personal/finanzas-pareja/` en el disco AF-Claude-T7.

> Estado: **Etapa 1 (esqueleto)** del plan v1. El login, la vista de mes y las
> notificaciones se cablean en la Etapa 3. Ver el plan para el detalle de etapas.

## Arranque local

```bash
npm install
cp .env.example .env.local   # y rellena las claves de Supabase (abajo)
npm run dev
```

Scripts: `npm run dev` (servidor local) · `npm run build` (producción) ·
`npm run preview` (previsualizar build) · `npm run lint`.

## Configurar Supabase (Etapa 2)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com) (región EU).
2. **Auth → Sign In / Providers:** Email activado; **desactiva «Allow new users to sign up»**
   (sin registro público).
3. **Auth → Users → Add user** dos veces: crea las 2 cuentas (email + contraseña).
   Copia el `User UID` de cada una.
4. **SQL Editor:** pega y ejecuta `supabase/schema.sql`. Luego edita `supabase/seed.sql`
   con los 2 UID reales (y emails/nombres) y ejecútalo.
5. **Project Settings → API:** copia `Project URL` y la clave `anon public` a tu `.env.local`:

   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

6. **Database → Replication / Publications:** confirma que la tabla `actividad` está en
   la publicación `supabase_realtime` (el `schema.sql` ya lo añade).

## Seguridad

- **Nunca** subas claves al repo: `.env.local` está en `.gitignore`. Usa `.env.example` como plantilla.
- En el frontend solo va la clave **anon** (pública por diseño); la `service_role` no se usa aquí.
- El despliegue (Netlify) lleva las variables en el **panel de Netlify**, no en el repo.

## Estructura

```
src/
  lib/supabaseClient.js     # cliente Supabase (Auth + datos + Realtime)
  App.jsx                   # esqueleto Etapa 1
supabase/
  schema.sql                # tablas + RLS + triggers de actividad
  seed.sql                  # hogar + 2 perfiles + categorías ES por defecto
```
