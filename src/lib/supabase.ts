import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente de Supabase para uso en el browser (client-side).
 * Se usa en componentes React (Astro Islands) como el Chat.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Crea un cliente de Supabase con tokens de sesión personalizados.
 * Se usa en el servidor (SSR) para operaciones autenticadas.
 */
export function createServerClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  });
}
