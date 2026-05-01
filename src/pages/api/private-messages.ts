import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { conversation_id, content } = await request.json();

    if (!conversation_id || !content) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // Insertar el mensaje privado
    const { data, error } = await supabase
      .from('private_messages')
      .insert({ 
        conversation_id, 
        profile_id: user.id, 
        content 
      })
      .select()
      .single();

    if (error) {
      console.error('------- SUPABASE INSERT PRIVATE MESSAGE ERROR -------');
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Opcional: Actualizar el updated_at de la conversación para que suba arriba en la lista
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
};
