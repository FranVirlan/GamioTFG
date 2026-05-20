import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { reward_id } = await request.json();
    if (!reward_id) {
      return new Response(JSON.stringify({ error: 'ID de recompensa requerido' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // Llamar a la función RPC buy_reward en base de datos de forma transaccional y segura
    const { data, error } = await supabase.rpc('buy_reward', {
      p_profile_id: user.id,
      p_reward_id: reward_id
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error del servidor' }), { status: 500 });
  }
};
