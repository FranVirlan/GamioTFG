-- ══════════════════════════════════════════════════════════
-- GAMIO — Sistema de Puntos, Niveles y Premios (Migración SQL)
-- Ejecutar en el SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════

-- 1. Añadir columnas de gamificación a la tabla public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS claimed_rewards TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS selected_title TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS selected_border TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Crear tabla de premios/recompensas
CREATE TABLE IF NOT EXISTS public.rewards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('title', 'border', 'badge')),
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en la tabla rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir que cualquiera pueda ver las recompensas
DROP POLICY IF EXISTS "Anyone can view rewards" ON public.rewards;
CREATE POLICY "Anyone can view rewards" ON public.rewards
    FOR SELECT USING (true);

-- 3. Poblar la tabla de recompensas con ítems iniciales
INSERT INTO public.rewards (id, title, description, cost, type, value)
VALUES
    ('title_casual', 'Gamer Casual 🎮', 'Perfecto para quienes juegan relajados para pasar el rato.', 40, 'title', 'Gamer Casual 🎮'),
    ('title_support', 'Soporte de Élite 🛡️', 'Siempre cuidando las espaldas de su equipo y tirando curas.', 150, 'title', 'Soporte de Élite 🛡️'),
    ('title_lone_wolf', 'Lobo Solitario 🐺', 'Prefiere jugar a su propio ritmo e imponer respeto solo.', 200, 'title', 'Lobo Solitario 🐺'),
    ('title_tryhard', 'Tryhard Certificado 🔥', 'Da el 200% en cada partida competitiva. Juega a ganar.', 250, 'title', 'Tryhard Certificado 🔥'),
    ('title_legend', 'Leyenda Viviente 🏆', 'El honor más alto para un jugador respetado por todos.', 500, 'title', 'Leyenda Viviente 🏆'),
    
    ('border_bronze', 'Borde de Bronce', 'Borde de bronce clásico para decorar tu avatar.', 120, 'border', 'border-bronze'),
    ('border_silver', 'Borde de Plata', 'Elegante borde plateado metálico que destaca tu avatar.', 250, 'border', 'border-silver'),
    ('border_gold', 'Borde de Oro', 'Prestigioso borde dorado brillante para jugadores de alto rango.', 500, 'border', 'border-gold'),
    ('border_neon', 'Neón Psicodélico', 'Efecto de neón animado cian y magenta que brilla intensamente.', 800, 'border', 'border-neon'),

    -- Nuevos Premios Especiales: Monedas de Juego de los 10 juegos de la Web (La mejor categoría, muy caras)
    ('coins_lol', '1380 Riot Points (League of Legends) 🎯', '¡Consigue 1380 RP para gastar en skins de League of Legends! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_lol'),
    ('coins_valorant', '1000 Puntos VP (Valorant) 🔫', '¡1000 Valorant Points para adquirir tus skins o pase de batalla! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_valorant'),
    ('coins_cs2', 'Llave de Caja CS2 / Saldo Steam 🔑', '¡Una llave de caja de Counter-Strike 2 o saldo Steam equivalente! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_cs2'),
    ('coins_dbd', '1100 Células Áuricas (Dead By Daylight) ☠️', '¡1100 Auric Cells para desbloquear personajes y skins en DBD! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_dbd'),
    ('coins_fortnite', '1000 Pavos (Fortnite) 🛡️', '¡1000 Monedas V-Bucks para gastar en la tienda de Fortnite! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_fortnite'),
    ('coins_apex', '1000 Monedas Apex (Apex Legends) 🧬', '¡1000 Monedas Apex para packs o skins en los Apex Games! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_apex'),
    ('coins_overwatch', '1000 Monedas Overwatch (Overwatch 2) 🤖', '¡1000 Monedas para la tienda de héroes o pase de batalla de OW2! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_overwatch'),
    ('coins_cod', '1100 Puntos COD (Warzone) 💣', '¡1100 COD Points (CP) para comprar packs en la tienda de Warzone! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_cod'),
    ('coins_rocket', '1100 Créditos (Rocket League) 🏎️', '¡1100 Créditos para conseguir calcomanías o autos en Rocket League! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_rocket'),
    ('coins_eafc', '1050 FC Points (EA FC 25) ⚽', '¡1050 Points para sobres de Ultimate Team en EA Sports FC 25! Compra y canjéalo con soporte.', 2000, 'badge', 'coins_eafc')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    cost = EXCLUDED.cost,
    type = EXCLUDED.type,
    value = EXCLUDED.value;

-- 4. Función segura para añadir puntos, XP y verificar subidas de nivel de forma automática
CREATE OR REPLACE FUNCTION public.earn_points(
    p_profile_id UUID,
    p_amount INTEGER,
    p_xp_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios del creador para bypassear RLS de forma segura
AS $$
DECLARE
    v_current_xp INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- 1. Obtener XP actual
    SELECT COALESCE(xp, 0) INTO v_current_xp
    FROM public.profiles
    WHERE id = p_profile_id;
    
    -- 2. Calcular nueva XP y nuevo nivel (1 nivel por cada 100 XP)
    v_new_xp := v_current_xp + p_xp_amount;
    v_new_level := 1 + (v_new_xp / 100);

    -- 3. Actualizar puntos, XP y nivel en el perfil
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + p_amount,
        xp = v_new_xp,
        level = GREATEST(COALESCE(level, 1), v_new_level)
    WHERE id = p_profile_id;
END;
$$;

-- 5. Función segura y transaccional para comprar recompensas
CREATE OR REPLACE FUNCTION public.buy_reward(
    p_profile_id UUID,
    p_reward_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cost INTEGER;
    v_points INTEGER;
    v_already_claimed BOOLEAN;
BEGIN
    -- 1. Obtener costo del premio
    SELECT cost INTO v_cost 
    FROM public.rewards 
    WHERE id = p_reward_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La recompensa no existe.';
    END IF;

    -- 2. Obtener puntos actuales del usuario
    SELECT COALESCE(points, 0) INTO v_points 
    FROM public.profiles 
    WHERE id = p_profile_id;
    
    IF v_points < v_cost THEN
        RAISE EXCEPTION 'Puntos insuficientes para adquirir este premio.';
    END IF;

    -- 3. Comprobar si ya ha comprado esta recompensa
    SELECT (p_reward_id = ANY(COALESCE(claimed_rewards, '{}'))) INTO v_already_claimed 
    FROM public.profiles 
    WHERE id = p_profile_id;
    
    IF v_already_claimed THEN
        RAISE EXCEPTION 'Ya has adquirido esta recompensa.';
    END IF;

    -- 4. Deducir puntos y añadir a claimed_rewards
    UPDATE public.profiles
    SET points = points - v_cost,
        claimed_rewards = array_append(COALESCE(claimed_rewards, '{}'), p_reward_id)
    WHERE id = p_profile_id;

    RETURN TRUE;
END;
$$;

-- 6. Función segura para reclamar la recompensa diaria
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
    
    -- Registrar fecha del reclamo actual
    UPDATE public.profiles
    SET last_daily_claim = now()
    WHERE id = p_profile_id;
    
    RETURN v_points_to_award;
END;
$$;
