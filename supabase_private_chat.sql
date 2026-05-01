-- 1. Crear tabla de conversaciones
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de participantes
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (conversation_id, profile_id)
);

-- 3. Crear tabla de mensajes privados
CREATE TABLE IF NOT EXISTS public.private_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habilitar Realtime para los nuevos mensajes
alter publication supabase_realtime add table public.private_messages;

-- 5. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para conversations
CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_participants.conversation_id = conversations.id
            AND conversation_participants.profile_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert conversations" ON public.conversations
    FOR INSERT WITH CHECK (true);

-- 7. Políticas para conversation_participants
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.profile_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert participants" ON public.conversation_participants
    FOR INSERT WITH CHECK (true);

-- 8. Políticas para private_messages
CREATE POLICY "Users can view messages in their conversations" ON public.private_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_participants.conversation_id = private_messages.conversation_id
            AND conversation_participants.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations" ON public.private_messages
    FOR INSERT WITH CHECK (
        auth.uid() = profile_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_participants.conversation_id = private_messages.conversation_id
            AND conversation_participants.profile_id = auth.uid()
        )
    );
