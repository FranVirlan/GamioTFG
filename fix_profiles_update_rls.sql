-- Permitir a los usuarios actualizar su propio perfil
-- Sin esta política, Supabase ignora silenciosamente los UPDATE por RLS.

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
