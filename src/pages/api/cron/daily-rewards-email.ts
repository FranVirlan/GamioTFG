import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { sendDailyRewardEmail } from '../../../lib/emailService';

/**
 * Endpoint de CRON para enviar recordatorios de recompensa diaria.
 * Puede ser llamado por servicios como GitHub Actions, Vercel Cron, EasyCron o Vesta.
 * 
 * Se puede proteger opcionalmente configurando la variable de entorno CRON_SECRET y
 * pasándola como cabecera 'Authorization: Bearer <CRON_SECRET>' o como parámetro '?token=<CRON_SECRET>'.
 */
export const GET: APIRoute = async ({ request }) => {
  const CRON_SECRET = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  
  if (CRON_SECRET) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const authHeader = request.headers.get('Authorization');
    const isTokenValid = token === CRON_SECRET || authHeader === `Bearer ${CRON_SECRET}`;

    if (!isTokenValid) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }
  }

  try {
    // 1. Obtener y marcar atómicamente a los destinatarios elegibles
    const { data: users, error } = await supabase.rpc('get_and_mark_daily_email_recipients');

    if (error) {
      console.error('❌ Error al ejecutar RPC get_and_mark_daily_email_recipients:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No hay usuarios elegibles para recibir el recordatorio de recompensa diaria hoy.' 
      }), { status: 200 });
    }

    console.log(`🚀 Iniciando el envío de correos a ${users.length} usuarios...`);
    const results = [];

    // 2. Enviar los correos de manera asíncrona
    for (const user of users) {
      const email = user.r_email;
      const name = user.r_name;

      if (email) {
        try {
          const sent = await sendDailyRewardEmail(email, name);
          results.push({ email, name, sent });
        } catch (mailErr) {
          console.error(`❌ Error al enviar correo de recordatorio a ${email}:`, mailErr);
          results.push({ email, name, sent: false, error: String(mailErr) });
        }
      }
    }

    return new Response(JSON.stringify({
      message: `Procesados ${users.length} correos de recordatorio correctamente.`,
      results
    }), { status: 200 });

  } catch (err) {
    console.error('❌ Error general en la ruta del Cron:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
