import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const accessToken = cookies.get('sb-access-token')?.value;
  const supabase = createServerClient(accessToken);

  // Obtener las conversaciones del usuario
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversations (
        id,
        updated_at,
        conversation_participants (
          profiles (
            id,
            name,
            avatar_url
          )
        )
      )
    `)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Mapear los datos para devolver algo más limpio
  const formattedConversations = data.map((cp: any) => {
    const conv = cp.conversations;
    // Encontrar al otro participante (que no sea yo)
    const otherParticipant = conv.conversation_participants.find(
      (p: any) => p.profiles.id !== user.id
    )?.profiles;

    return {
      id: conv.id,
      updated_at: conv.updated_at,
      other_user: otherParticipant
    };
  }).filter((c: any) => c.other_user); // Solo devolvemos si hay otro usuario

  return new Response(JSON.stringify(formattedConversations), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { target_profile_id } = await request.json();

    if (!target_profile_id) {
      return new Response(JSON.stringify({ error: 'Falta target_profile_id' }), { status: 400 });
    }

    if (target_profile_id === user.id) {
      return new Response(JSON.stringify({ error: 'No puedes chatear contigo mismo' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const supabase = createServerClient(accessToken);

    // 1. Verificar si ya existe una conversación entre estos dos usuarios
    const { data: existingConversations, error: searchError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .in('profile_id', [user.id, target_profile_id]);

    if (searchError) throw searchError;

    // Tenemos que buscar si hay un conversation_id que tenga exactamente ambos
    // count de apariciones de conversation_id = 2
    const conversationCounts = existingConversations?.reduce((acc: any, curr: any) => {
      acc[curr.conversation_id] = (acc[curr.conversation_id] || 0) + 1;
      return acc;
    }, {});

    let existingId = null;
    for (const [convId, count] of Object.entries(conversationCounts || {})) {
      if (count === 2) {
        existingId = convId;
        break;
      }
    }

    if (existingId) {
      return new Response(JSON.stringify({ id: existingId }), { status: 200 });
    }

    // 2. Si no existe, crear la conversación con un ID generado
    const newConvId = crypto.randomUUID();
    const { error: createConvError } = await supabase
      .from('conversations')
      .insert({ id: newConvId });

    if (createConvError) throw createConvError;

    // 3. Añadir a los participantes
    const { error: insertParticipantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConvId, profile_id: user.id },
        { conversation_id: newConvId, profile_id: target_profile_id }
      ]);

    if (insertParticipantsError) throw insertParticipantsError;

    return new Response(JSON.stringify({ id: newConvId }), { status: 200 });
  } catch (err: any) {
    console.error('Error creating conversation:', err);
    return new Response(JSON.stringify({ error: err.message || 'Error del servidor' }), { status: 500 });
  }
};
