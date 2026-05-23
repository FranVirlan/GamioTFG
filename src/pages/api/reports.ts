import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

/**
 * Endpoint para manejar reportes de incidencias.
 * - POST: Permite a cualquier usuario autenticado enviar un reporte contra otro jugador.
 * - PUT: Permite únicamente a administradores cambiar el estado de un reporte.
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado: debes iniciar sesión.' }), { status: 401 });
  }

  try {
    const { reported_id, reason, details, chat_room } = await request.json();
    
    if (!reported_id || !reason) {
      return new Response(JSON.stringify({ error: 'El ID del jugador reportado y la razón son obligatorios.' }), { status: 400 });
    }

    if (reported_id === user.id) {
      return new Response(JSON.stringify({ error: 'No puedes reportarte a ti mismo.' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_id,
        reason,
        details: details || '',
        chat_room: chat_room || '',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error insertando reporte en Supabase:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });

  } catch (err) {
    console.error('Error en POST /api/reports:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 401 });
  }

  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // 1. Validar rigurosamente que el usuario firmante sea Administrador
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: se requieren permisos de administrador.' }), { status: 403 });
    }

    const { report_id, status } = await request.json();

    if (!report_id || !status) {
      return new Response(JSON.stringify({ error: 'El ID del reporte y el nuevo estado son obligatorios.' }), { status: 400 });
    }

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Estado del reporte inválido.' }), { status: 400 });
    }

    // 2. Actualizar el estado del reporte
    const { data, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', report_id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar reporte:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });

  } catch (err) {
    console.error('Error en PUT /api/reports:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
};
