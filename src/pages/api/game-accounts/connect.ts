import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';
import { 
  fetchValorantStats, 
  fetchLoLStats, 
  fetchFortniteStats, 
  fetchApexStats, 
  fetchGenericGameStats, 
  type GameAccountStats 
} from '../../../lib/gameStats';

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

    // 1. Obtener estadísticas autenticadas/verificadas del juego
    let stats: GameAccountStats;
    const normalizedGame = game.trim();

    if (normalizedGame.toLowerCase() === 'valorant') {
      stats = await fetchValorantStats(handle, region || 'eu');
    } else if (normalizedGame.toLowerCase() === 'league of legends' || normalizedGame.toLowerCase() === 'lol') {
      stats = await fetchLoLStats(handle, region || 'euw');
    } else if (normalizedGame.toLowerCase() === 'fortnite') {
      stats = await fetchFortniteStats(handle);
    } else if (normalizedGame.toLowerCase() === 'apex legends' || normalizedGame.toLowerCase() === 'apex') {
      stats = await fetchApexStats(handle, platform || 'PC');
    } else {
      stats = await fetchGenericGameStats(normalizedGame, handle, platform || 'PC');
    }

    // 2. Conectar con Supabase y obtener las cuentas de juego actuales
    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    const { data: currentProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('game_accounts')
      .eq('id', user.id)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.error('Error al obtener perfil:', fetchErr);
    }

    const currentAccounts = currentProfile?.game_accounts || {};
    const updatedAccounts = {
      ...currentAccounts,
      [normalizedGame]: stats
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
      message: `Cuenta de ${normalizedGame} vinculada con éxito.`,
      stats 
    }), { status: 200 });

  } catch (err: any) {
    console.error('Error en /api/game-accounts/connect:', err);
    return new Response(JSON.stringify({ error: err.message || 'Error al conectar con el servidor de estadísticas.' }), { status: 500 });
  }
};
