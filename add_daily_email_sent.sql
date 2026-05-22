-- ══════════════════════════════════════════════════════════
-- GAMIO — Sistema de Avisos por Correo y Recompensa Diaria
-- Ejecutar en el SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════

-- 1. Añadir columna email a profiles si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Rellenar los correos para los perfiles existentes
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. Añadir columna daily_email_sent a profiles si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_email_sent BOOLEAN DEFAULT false;

-- 4. Crear o actualizar la función del trigger de nuevos usuarios para incluir el email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, points, xp, level, daily_email_sent)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    0,
    0,
    1,
    true -- Los usuarios nuevos no necesitan aviso inmediato hasta que reclamen por primera vez
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(public.profiles.name, EXCLUDED.name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurarse de que el trigger está correctamente enlazado si por alguna razón se borró
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Actualizar la función claim_daily_points para resetear daily_email_sent a false al reclamar
DROP FUNCTION IF EXISTS public.claim_daily_points(UUID);

CREATE OR REPLACE FUNCTION public.claim_daily_points(
    p_profile_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_claim TIMESTAMP WITH TIME ZONE;
    v_points_to_award INTEGER := 25;
    v_xp_to_award INTEGER := 25;
BEGIN
    -- Obtener última fecha de reclamo
    SELECT last_daily_claim INTO v_last_claim 
    FROM public.profiles 
    WHERE id = p_profile_id;
    
    -- Validar que hayan pasado 24 horas (o sea nulo)
    IF v_last_claim IS NOT NULL AND v_last_claim > now() - INTERVAL '24 hours' THEN
        RAISE EXCEPTION 'Ya has reclamado tus puntos diarios. Vuelve en unas horas.';
    END IF;
    
    -- Añadir puntos y XP llamando a la función interna
    PERFORM public.earn_points(p_profile_id, v_points_to_award, v_xp_to_award);
    
    -- Registrar fecha del reclamo actual y resetear daily_email_sent a false
    UPDATE public.profiles
    SET last_daily_claim = now(),
        daily_email_sent = false
    WHERE id = p_profile_id;
    
    RETURN v_points_to_award;
END;
$$;

-- 6. Función segura y atómica para obtener destinatarios del correo de recompensa diaria y marcarlos como enviados
CREATE OR REPLACE FUNCTION public.get_and_mark_daily_email_recipients()
RETURNS TABLE (
    r_id UUID,
    r_name TEXT,
    r_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH targets AS (
        UPDATE public.profiles
        SET daily_email_sent = true
        WHERE last_daily_claim IS NOT NULL 
          AND last_daily_claim <= now() - INTERVAL '24 hours'
          AND daily_email_sent = false
          AND email IS NOT NULL
          AND email <> ''
        RETURNING id, name, email
    )
    SELECT id, name, email FROM targets;
END;
$$;
