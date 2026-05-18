-- 1. Crear tabla de solicitudes de amistad
CREATE TABLE public.friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id) -- Un usuario no puede enviar 2 peticiones a la misma persona
);

-- 2. Habilitar seguridad a nivel de fila (RLS)
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 3. Políticas
-- Puedes ver las peticiones si eres el que las envió o el que las recibió
CREATE POLICY "Users can view their own friend requests" ON public.friend_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Puedes crear peticiones si eres el remitente
CREATE POLICY "Users can create friend requests" ON public.friend_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Puedes actualizar peticiones (aceptar/rechazar) solo si eres el receptor
CREATE POLICY "Users can update received requests" ON public.friend_requests
    FOR UPDATE USING (auth.uid() = receiver_id);

-- (Opcional) Eliminar peticiones propias
CREATE POLICY "Users can delete their requests" ON public.friend_requests
    FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
