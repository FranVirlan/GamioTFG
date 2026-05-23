import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';

/**
 * Endpoint administrativo para suspender (banear) o activar cuentas de jugadores.
 * POST: { target_profile_id: string, banned: boolean }
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 401 });
  }

  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // 1. Validar rigurosamente que el usuario sea administrador
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: se requieren permisos de administrador.' }), { status: 403 });
    }

    const { target_profile_id, banned } = await request.json();

    if (!target_profile_id || typeof banned === 'undefined') {
      return new Response(JSON.stringify({ error: 'El ID del jugador objetivo y el estado de baneo son obligatorios.' }), { status: 400 });
    }

    if (target_profile_id === user.id) {
      return new Response(JSON.stringify({ error: 'No puedes suspender tu propia cuenta de administrador.' }), { status: 400 });
    }

    // 2. Actualizar el estado de baneo del jugador objetivo
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_banned: banned })
      .eq('id', target_profile_id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar estado de baneo:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({
      message: banned ? 'Jugador suspendido con éxito.' : 'Suspensión del jugador levantada con éxito.',
      profile: data
    }), { status: 200 });

  } catch (err) {
    console.error('Error en POST /api/admin/ban:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
};
