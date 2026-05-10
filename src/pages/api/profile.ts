import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

export const PUT: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, favorite_games, play_style, player_type_sought } = body;

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (favorite_games !== undefined) updateData.favorite_games = favorite_games;
    if (play_style !== undefined) updateData.play_style = play_style;
    if (player_type_sought !== undefined) updateData.player_type_sought = player_type_sought;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
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
