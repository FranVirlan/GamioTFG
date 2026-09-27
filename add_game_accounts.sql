-- Añadir columna game_accounts a la tabla profiles para guardar estadísticas de múltiples juegos
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS game_accounts JSONB DEFAULT '{}'::jsonb;

-- Comentario explicativo en la columna
COMMENT ON COLUMN public.profiles.game_accounts IS 'Objeto JSONB que contiene las cuentas vinculadas por juego y sus estadísticas (Riot, Epic, Steam, etc.)';
