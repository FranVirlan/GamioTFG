-- ══════════════════════════════════════════════════════════
-- GAMIO — Corrección de Políticas RLS para Baneo de Usuarios
-- Ejecutar en el SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════

-- 1. Crear función segura para verificar si el usuario actual es administrador
-- (Esto corre con privilegios definidos y evita recursión infinita en las políticas de la tabla profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear la política de actualización para administradores en la tabla profiles
DROP POLICY IF EXISTS "Administrators can update any profile" ON public.profiles;
CREATE POLICY "Administrators can update any profile"
ON public.profiles
FOR UPDATE TO authenticated
USING (
    public.is_admin()
);
