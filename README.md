# Lumina Social

Plataforma de experiencias interactivas para bodas y eventos sociales.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Framer Motion · Lucide · Socket.IO (deps listas)

## Arranque

```bash
# .env.local ya debe tener URL + anon/publishable key
cp .env.local.example .env.local   # solo si partes de cero
npm install
npm run dev
```

Ejecuta una vez [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de Supabase (tablas, Storage `event-photos`, RLS, Realtime).

## Evento activo

Paparazzi y Moderador resuelven el evento así:

1. `?eventId=<uuid>` o `?code=BODA-XXX`
2. Si no hay params → `NEXT_PUBLIC_DEMO_EVENT_ID`
3. Si falla → get/create evento `code: DEMO`

Ejemplos: `/paparazzi?code=DEMO` · `/moderator?code=DEMO`

Tras el schema base, ejecuta también:

1. [`supabase/realtime_gamification.sql`](supabase/realtime_gamification.sql) — Realtime de votos  
2. [`supabase/seed.sql`](supabase/seed.sql) — evento DEMO + 10 trivias  
3. [`supabase/archive_albums.sql`](supabase/archive_albums.sql) — columnas de álbum archivado (token, caducidad, soft-delete)  

Para «Borrar todo» en admin hace falta `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.

### Cómo aplicar el seed en Supabase Cloud

1. Abre tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)  
2. Menú izquierdo → **SQL Editor** → **New query**  
3. Abre el archivo `supabase/seed.sql` del repo, copia **todo** el contenido y pégalo en el editor  
4. Pulsa **Run** (o Ctrl/Cmd + Enter)  
5. Verifica en **Table Editor**:  
   - `events` → fila `DEMO` / `Gala de Prueba Lumina`  
   - `live_screen_state` → `IDLE`  
   - `trivia_questions` → 10 filas del evento demo  

Prueba local: `/paparazzi?code=DEMO`, `/moderator?code=DEMO`, `/screen?code=DEMO`  
Admin: `/admin/login` con `ADMIN_EMAIL` / `ADMIN_PASSWORD` de `.env.local`  
Opcional en `.env.local`: `NEXT_PUBLIC_DEMO_EVENT_ID=00000000-0000-0000-0000-000000000001`

## Rutas base

| Ruta | Descripción |
|------|-------------|
| `/` | Landing |
| `/admin/login` | Login administrador (`.env`) |
| `/admin` | Centro de control · CRUD, archivar álbum, eliminar |
| `/paparazzi` | Captura móvil Paparazzi |
| `/moderator` | Moderación + Trivia + Pose Battle |
| `/guest` | Invitado + EN VIVO + votaciones |
| `/screen` | Pantalla gigante (TV) |
| `/magazine/[slug]` | Revista / álbum (UUID en vivo o token archivado) |
| `/login` | Auth placeholder genérico |
| `/api/health` | Health check |

## Estructura

```
app/(main)/{paparazzi,guest}
app/(dashboard)/moderator
app/(screen)/screen
components/{paparazzi,moderator,screen,guest}
hooks/{useEventContext,usePhotosRealtime,useModerationKeys,useLiveScreenSync}
lib/events/resolve-event.ts
lib/images/compress-image.ts
lib/supabase/queries.ts
```
