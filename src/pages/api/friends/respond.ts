import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';

export const PUT: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('sb-access-token')?.value;
  if (!token) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const supabase = createServerClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  try {
    const { request_id, status } = await request.json();
    if (!request_id || !['accepted', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos' }), { status: 400 });
    }

    // Si se rechaza, es mejor eliminar la solicitud directamente para mantener limpia la BD
    if (status === 'rejected') {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', request_id)
        .eq('receiver_id', user.id);
        
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ success: true, message: 'Solicitud rechazada' }), { status: 200 });
    }

    // Si se acepta
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', request_id)
      .eq('receiver_id', user.id) // Solo el receptor puede responder
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
};
