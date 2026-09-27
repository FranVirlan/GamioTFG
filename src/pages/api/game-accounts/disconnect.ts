import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Debes iniciar sesión.' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { game } = body;

    if (!game) {
      return new Response(JSON.stringify({ error: 'Debes especificar el juego a desvincular.' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('game_accounts')
      .eq('id', user.id)
      .single();

    const currentAccounts = currentProfile?.game_accounts || {};
    delete currentAccounts[game];

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ game_accounts: currentAccounts })
      .eq('id', user.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: 'Error al desvincular la cuenta.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Cuenta de ${game} desvinculada correctamente.` 
    }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Error del servidor al desvincular.' }), { status: 500 });
  }
};
