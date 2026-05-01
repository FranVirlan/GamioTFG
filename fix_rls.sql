-- 1. Crear una función "Security Definer" que se salta el RLS para comprobar la participación sin causar bucles infinitos
CREATE OR REPLACE FUNCTION public.is_participant(conv_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = conv_id 
    AND profile_id = auth.uid()
  );
$$;

-- 2. Borrar las políticas antiguas que causaban el bucle
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.private_messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.private_messages;

-- 3. Crear las nuevas políticas usando la función segura
CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (public.is_participant(id));

CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
    FOR SELECT USING (public.is_participant(conversation_id));

CREATE POLICY "Users can view messages in their conversations" ON public.private_messages
    FOR SELECT USING (public.is_participant(conversation_id));

CREATE POLICY "Users can insert messages in their conversations" ON public.private_messages
    FOR INSERT WITH CHECK (
        auth.uid() = profile_id AND
        public.is_participant(conversation_id)
    );
