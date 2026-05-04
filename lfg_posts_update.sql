-- Añadir nuevos campos para soportar funcionalidad LFG (Looking For Group)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS game text,
ADD COLUMN IF NOT EXISTS mode text,
ADD COLUMN IF NOT EXISTS spots integer,
ADD COLUMN IF NOT EXISTS tags text[];

-- Asegurarse de que al menos exista contenido y el creador (el resto pueden ser nulos si no los llenan)
-- No añadimos constraints NOT NULL a los nuevos campos para no romper posts existentes, 
-- pero se controlará desde el frontend/backend.
