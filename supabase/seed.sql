-- =============================================================================
-- Lumina Social — Seed Data (desarrollo)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- Limpia un DEMO previo con otro UUID (p. ej. creado por la app) para no chocar
-- con UNIQUE(code). Cascada elimina fotos/trivia/live asociadas a ese evento.
DELETE FROM events
WHERE code = 'DEMO'
  AND id <> '00000000-0000-0000-0000-000000000001';

-- 1) Evento demo
INSERT INTO events (id, name, code, is_active, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Gala de Prueba Lumina',
  'DEMO',
  TRUE,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  is_active = EXCLUDED.is_active;

-- 2) Estado inicial de pantalla en vivo
INSERT INTO live_screen_state (event_id, current_view, active_payload, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'IDLE',
  '{}'::JSONB,
  NOW()
)
ON CONFLICT (event_id) DO UPDATE SET
  current_view = EXCLUDED.current_view,
  active_payload = EXCLUDED.active_payload,
  updated_at = EXCLUDED.updated_at;

-- 3) Banco de 10 preguntas de trivia (reemplaza las del evento demo)
DELETE FROM trivia_questions
WHERE event_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO trivia_questions (
  event_id,
  question,
  options,
  correct_option,
  is_active,
  created_at
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  '¿Dónde se conocieron los festejados?',
  '["Universidad", "Trabajo", "Una boda ajena", "Apps de citas"]'::JSONB,
  0,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿Quién dijo ''Te amo'' primero?',
  '["Él", "Ella", "Al mismo tiempo", "El padrino en el discurso"]'::JSONB,
  1,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿A dónde irán de luna de miel?',
  '["Italia", "Japón", "Playa secreta", "Quedarse a dormir la mona"]'::JSONB,
  2,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿Cuál es la canción de su primer baile?',
  '["Perfect — Ed Sheeran", "At Last — Etta James", "Una cumbia remix", "Lo que ponga el DJ"]'::JSONB,
  0,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿Quién llega siempre tarde?',
  '["La novia", "El novio", "Los dos", "La tía que trae el pastel"]'::JSONB,
  2,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿Cuál es el postre favorito de la pareja?',
  '["Tiramisú", "Cheesecake", "Pastel de chocolate", "Fruta… mentira"]'::JSONB,
  1,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿Qué mascota tendrían primero?',
  '["Perro", "Gato", "Ninguna: viajan mucho", "Un pez llamado Rolando"]'::JSONB,
  0,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿Quién es peor cocinando?',
  '["Él", "Ella", "Empate técnico", "Piden delivery ambos"]'::JSONB,
  3,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿Cuál fue la propuesta de matrimonio?',
  '["En la playa al atardecer", "En casa con pizza", "En un viaje sorpresa", "En el aeropuerto"]'::JSONB,
  0,
  FALSE,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000001',
  '¿Qué harán con el ramo / bouquet?',
  '["Lo tira la novia", "Lo rifan entre mesas", "Se lo queda la mamá", "Lo subastan en Trivia"]'::JSONB,
  1,
  FALSE,
  NOW()
);
