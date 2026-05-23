-- ══════════════════════════════════════════════════════════
-- GAMIO — Sistema de Reporte, Auditoría de Chats y Sanciones
-- Ejecutar en el SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════

-- 1. Añadir columnas de administración y suspensión a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- 2. Crear tabla de reportes / incidencias de jugadores
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('chat_abuse', 'gameplay_abuse', 'spam', 'other')),
    details TEXT,
    chat_room TEXT, -- Nombre de la sala de chat (#Lobby Global, chat privado, etc.)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en la tabla de reportes
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para la tabla reports
-- Permiso para insertar: Cualquier usuario logueado puede enviar un reporte
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON public.reports;
CREATE POLICY "Authenticated users can insert reports" ON public.reports
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

-- Permiso para ver: Los usuarios pueden ver sus propios reportes, y los administradores pueden ver todos
DROP POLICY IF EXISTS "Only administrators can view reports" ON public.reports;
CREATE POLICY "Only administrators can view reports" ON public.reports
    FOR SELECT TO authenticated
    USING (
        auth.uid() = reporter_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Permiso para actualizar: Solo los administradores pueden editar reportes (cambiar estado)
DROP POLICY IF EXISTS "Only administrators can update reports" ON public.reports;
CREATE POLICY "Only administrators can update reports" ON public.reports
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 4. Trigger de base de datos para bloquear de raíz cualquier inserción si el usuario está baneado
CREATE OR REPLACE FUNCTION public.check_banned_user()
RETURNS trigger AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_banned = true
    ) THEN
        RAISE EXCEPTION 'Acceso denegado: Tu cuenta ha sido suspendida de Gamio por infracción de nuestras políticas de conducta.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar la restricción de baneo a chats públicos (messages)
DROP TRIGGER IF EXISTS trg_check_banned_messages ON public.messages;
CREATE TRIGGER trg_check_banned_messages
    BEFORE INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.check_banned_user();

-- Aplicar la restricción de baneo a chats privados (private_messages)
DROP TRIGGER IF EXISTS trg_check_banned_private_messages ON public.private_messages;
CREATE TRIGGER trg_check_banned_private_messages
    BEFORE INSERT ON public.private_messages
    FOR EACH ROW EXECUTE FUNCTION public.check_banned_user();

-- Aplicar la restricción de baneo a publicaciones de comunidad (posts)
DROP TRIGGER IF EXISTS trg_check_banned_posts ON public.posts;
CREATE TRIGGER trg_check_banned_posts
    BEFORE INSERT ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.check_banned_user();

-- Aplicar la restricción de baneo a solicitudes de amistad (friend_requests)
DROP TRIGGER IF EXISTS trg_check_banned_friends ON public.friend_requests;
CREATE TRIGGER trg_check_banned_friends
    BEFORE INSERT ON public.friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.check_banned_user();
