-- 1. Asegurar que is_read existe y tiene un valor por defecto
ALTER TABLE public.private_messages 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 2. Marcar todos los mensajes antiguos como leídos (para no generar notificaciones falsas)
UPDATE public.private_messages SET is_read = true WHERE is_read IS NULL;

-- 3. Añadir política de UPDATE para que los usuarios puedan marcar como leídos los mensajes en sus conversaciones
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.private_messages;

CREATE POLICY "Users can update messages in their conversations" 
ON public.private_messages FOR UPDATE 
USING (public.is_participant(conversation_id));
