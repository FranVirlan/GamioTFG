import type { APIRoute } from 'astro';
import { createServerClient } from '../../lib/supabase';
import { sendB2BLeadEmail } from '../../lib/emailService';

// Headers CORS comunes para permitir peticiones desde el dominio de la landing
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Manejo del preflight request de CORS (OPTIONS)
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

// Manejo del envío del formulario (POST)
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let email = '';
    let company = '';
    let message = '';

    // Soporte para JSON y x-www-form-urlencoded
    if (contentType.includes('application/json')) {
      const body = await request.json();
      name = body.name;
      email = body.email;
      company = body.company;
      message = body.message;
    } else {
      const formData = await request.formData();
      name = formData.get('name')?.toString() || '';
      email = formData.get('email')?.toString() || '';
      company = formData.get('company')?.toString() || '';
      message = formData.get('message')?.toString() || '';
    }

    // Validación básica en el servidor
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos (nombre, email, mensaje).' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Crear cliente de Supabase (servidor)
    const supabase = createServerClient();

    // Insertar el lead en la base de datos
    const { error } = await supabase
      .from('leads_b2b')
      .insert([
        {
          name,
          email,
          company: company || null,
          message,
        }
      ]);

    if (error) {
      console.error('Error al insertar lead B2B en Supabase:', error);
      return new Response(
        JSON.stringify({ error: 'No se pudo guardar la solicitud. Inténtalo de nuevo.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Enviar correo de notificación al administrador (de forma asíncrona no bloqueante)
    try {
      sendB2BLeadEmail('iscovr3@gmail.com', name, email, company, message);
    } catch (mailErr) {
      console.error('Error al enviar notificación de correo B2B:', mailErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: '¡Solicitud recibida correctamente!' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Error en el endpoint de contacto:', err);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: corsHeaders }
    );
  }
};

