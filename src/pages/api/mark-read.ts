import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { conversation_id } = await request.json();

    if (!conversation_id) {
      return new Response(JSON.stringify({ error: 'Falta conversation_id' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // Marcar como leídos todos los mensajes de esa conversación que NO son míos
    const { error } = await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation_id)
      .neq('profile_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marcando como leídos:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
};
