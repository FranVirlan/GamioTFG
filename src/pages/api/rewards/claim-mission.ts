import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Debes iniciar sesión para reclamar misiones.' }), { status: 401 });
  }

  try {
    const { mission_id, points, xp } = await request.json();
    if (!mission_id || typeof points !== 'number') {
      return new Response(JSON.stringify({ error: 'Datos de misión no válidos.' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // Obtener perfil actual del usuario
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (pErr || !profile) {
      return new Response(JSON.stringify({ error: 'Perfil de usuario no encontrado.' }), { status: 404 });
    }

    const completed: string[] = profile.completed_missions || [];
    if (completed.includes(mission_id)) {
      return new Response(JSON.stringify({ error: '¡Ya has reclamado esta misión!' }), { status: 400 });
    }

    const newPoints = (profile.points || 0) + points;
    const newXp = (profile.xp || 0) + (xp || points);
    const newLevel = Math.floor(newXp / 100) + 1;
    const newCompleted = [...completed, mission_id];

    // Intentar actualizar perfil en Supabase
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        points: newPoints,
        xp: newXp,
        level: newLevel,
        completed_missions: newCompleted
      })
      .eq('id', user.id);

    if (updateErr) {
      // Fallback si la columna completed_missions no existiera en el esquema
      const { error: fallbackErr } = await supabase
        .from('profiles')
        .update({
          points: newPoints,
          xp: newXp,
          level: newLevel
        })
        .eq('id', user.id);

      if (fallbackErr) {
        return new Response(JSON.stringify({ error: fallbackErr.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      points: newPoints,
      xp: newXp,
      level: newLevel,
      mission_id
    }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error en el servidor al reclamar misión.' }), { status: 500 });
  }
};
