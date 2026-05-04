-- Habilitar RLS en posts por si acaso
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Borrar políticas antiguas si existieran
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

-- 1. Permitir a cualquiera ver los posts
CREATE POLICY "Users can view all posts" 
ON public.posts FOR SELECT 
USING (true);

-- 2. Permitir a usuarios autenticados crear posts (verificando que el author_id coincide con su sesión)
CREATE POLICY "Users can insert their own posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- 3. Permitir actualizar sus propios posts
CREATE POLICY "Users can update their own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = author_id);

-- 4. Permitir borrar sus propios posts
CREATE POLICY "Users can delete their own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = author_id);
