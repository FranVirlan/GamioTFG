import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  // Si la búsqueda es muy corta o nula, devolvemos array vacío
  if (!query || query.length < 2) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  try {
    // Buscar en perfiles por nombre (ignorando mayúsculas/minúsculas)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .ilike('name', `%${query}%`)
      .limit(5);

    if (error) {
      console.error('Error buscando usuarios:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
