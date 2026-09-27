import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';
import { createTrackerGameAccount } from '../../../lib/gameStats';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Debes iniciar sesión para vincular tus cuentas.' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { game, handle, platform, region } = body;

    if (!game || !handle) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros obligatorios: juego e identificador de cuenta.' }), { status: 400 });
    }

    // 1. Generar la vinculación oficial con Tracker.gg
    const stats = await createTrackerGameAccount({
      game: game.trim(),
      handle: handle.trim(),
      platform: platform || undefined,
      region: region || 'EUW'
    });

    // 2. Conectar con Supabase y obtener las cuentas de juego actuales
    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('game_accounts')
      .eq('id', user.id)
      .single();

    const currentAccounts = currentProfile?.game_accounts || {};
    const updatedAccounts = {
      ...currentAccounts,
      [game.trim()]: stats
    };

    // 3. Actualizar la columna game_accounts en Supabase
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ game_accounts: updatedAccounts })
      .eq('id', user.id);

    if (updateErr) {
      console.error('Error al actualizar game_accounts en Supabase:', updateErr);
      return new Response(JSON.stringify({ error: 'No se pudo guardar la vinculación en la base de datos.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Cuenta de ${game} vinculada con éxito a Tracker.gg.`,
      stats 
    }), { status: 200 });

  } catch (err: any) {
    console.error('Error en /api/game-accounts/connect:', err);
    return new Response(JSON.stringify({ error: err.message || 'Error al conectar con el servidor.' }), { status: 500 });
  }
};
