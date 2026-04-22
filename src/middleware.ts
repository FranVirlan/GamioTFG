import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from './lib/supabase';

/** Rutas que requieren autenticación */
const protectedRoutes = ['/configuracion', '/perfil'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect } = context;

  // Leer tokens de las cookies
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  // Por defecto, no hay usuario
  context.locals.user = null;

  if (accessToken) {
    const supabase = createServerClient(accessToken);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) {
      // Token válido → usuario autenticado
      context.locals.user = user;
    } else if (refreshToken) {
      // Token expirado → intentar refresh
      const supabaseRefresh = createServerClient();
      const { data, error: refreshError } = await supabaseRefresh.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (data?.session && !refreshError) {
        // Refresh exitoso → actualizar cookies y usuario
        context.locals.user = data.session.user;

        cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hora
        });
        cookies.set('sb-refresh-token', data.session.refresh_token!, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 días
        });
      }
    }
  }

  // Proteger rutas privadas
  const isProtected = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isProtected && !context.locals.user) {
    return redirect('/login');
  }

  // Si el usuario ya está autenticado e intenta ir a login/signup → redirigir a /
  if (context.locals.user && (url.pathname === '/login' || url.pathname === '/signup')) {
    return redirect('/');
  }

  return next();
});
