-- Añadir campos de onboarding a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS favorite_games text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS play_style text DEFAULT '',
ADD COLUMN IF NOT EXISTS player_type_sought text DEFAULT '',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Asegurarse de que el bucket de avatares u otros elementos necesarios estén configurados si no lo estaban (opcional, pero buena práctica)
-- También podemos actualizar las políticas si es necesario, aunque los usuarios pueden actualizar sus propios perfiles.
