import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { content } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Contenido vacío' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    const { data, error } = await supabase
      .from('messages')
      .insert({ profile_id: user.id, content })
      .select()
      .single();

    if (error) {
      console.error('------- SUPABASE INSERT ERROR -------');
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
};
