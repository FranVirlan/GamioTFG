import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { content, game, mode, spots, tags } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'El contenido es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        content: content,
        game: game || null,
        mode: mode || null,
        spots: spots ? parseInt(spots) : null,
        tags: tags || []
      })
      .select()
      .single();

    if (error) throw error;

    // Otorgar +15 puntos y +30 XP al autor por crear un post
    try {
      await supabase.rpc('earn_points', {
        p_profile_id: user.id,
        p_amount: 15,
        p_xp_amount: 30
      });
    } catch (rpcErr) {
      console.error('Error al otorgar puntos por post:', rpcErr);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error creando post:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'El ID del post es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (post.author_id !== user.id) {
      return new Response(JSON.stringify({ error: 'No tienes permiso para eliminar este post' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error eliminando post:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
