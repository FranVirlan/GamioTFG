-- Crear tabla para los leads B2B de la landing page
CREATE TABLE IF NOT EXISTS public.leads_b2b (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE public.leads_b2b ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquier usuario (incluso no autenticado / anon) inserte registros
CREATE POLICY "Permitir inserciones publicas" 
ON public.leads_b2b 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Por defecto, sin política de SELECT para anon, nadie externo podrá leer los registros.
-- Esto protege los datos recopilados frente a posibles accesos no autorizados.
