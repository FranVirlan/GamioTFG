import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ count: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // Obtener las conversaciones del usuario
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', user.id);

    if (!participations || participations.length === 0) {
      return new Response(JSON.stringify({ count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const convIds = participations.map(p => p.conversation_id);

    // Contar mensajes no leídos que NO son míos
    const { count, error } = await supabase
      .from('private_messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('profile_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error contando mensajes no leídos:', error);
      return new Response(JSON.stringify({ count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ count: count || 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error en unread-count:', err);
    return new Response(JSON.stringify({ count: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
