import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('sb-access-token')?.value;
  if (!token) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const supabase = createServerClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  try {
    const { receiver_id } = await request.json();
    if (!receiver_id) return new Response(JSON.stringify({ error: 'Falta receiver_id' }), { status: 400 });
    if (receiver_id === user.id) return new Response(JSON.stringify({ error: 'No puedes añadirte a ti mismo' }), { status: 400 });

    // Check if there is already a relationship (in any direction)
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Ya existe una solicitud o amistad previa' }), { status: 400 });
    }

    // Insert request
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
};
