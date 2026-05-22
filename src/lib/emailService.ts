import nodemailer from 'nodemailer';

// Obtener las credenciales desde variables de entorno
const EMAIL_USER = import.meta.env.EMAIL_USER || process.env.EMAIL_USER;
const EMAIL_PASS = import.meta.env.EMAIL_PASS || process.env.EMAIL_PASS;

/**
 * Crea el transportador de correo SMTP utilizando Gmail con la contraseña de aplicación.
 */
function createTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn("⚠️ Advertencia: EMAIL_USER o EMAIL_PASS no están configurados en las variables de entorno. Los correos no se enviarán.");
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

/**
 * Plantilla de diseño base premium para los correos de Gamio (Estética Gaming, Dark Mode y Neon Glow)
 */
function getEmailHTMLWrapper(title: string, bodyContent: string, ctaHtml = ''): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #060911;
          font-family: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #F8FAFC;
          -webkit-font-smoothing: antialiased;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .card {
          background-color: #0C0F19;
          border: 1px solid #1E293B;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(0, 240, 255, 0.1) inset;
        }
        .header {
          padding: 30px 40px 20px;
          text-align: center;
          border-bottom: 1px solid #1E293B;
        }
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #FFFFFF;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .logo span {
          background: linear-gradient(135deg, #00F0FF 0%, #7C3AED 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .content {
          padding: 40px;
        }
        h2 {
          font-size: 22px;
          margin-top: 0;
          color: #FFFFFF;
          line-height: 1.3;
          font-weight: 700;
        }
        p {
          font-size: 16px;
          line-height: 1.7;
          color: #94A3B8;
          margin-bottom: 24px;
        }
        .cta-container {
          text-align: center;
          margin: 35px 0 15px;
        }
        .btn-neon {
          display: inline-block;
          background: linear-gradient(135deg, #00F0FF 0%, #7C3AED 100%);
          color: #FFFFFF !important;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 30px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 20px rgba(0, 240, 255, 0.25);
          transition: all 0.3s ease;
        }
        .footer {
          padding: 30px 40px;
          text-align: center;
          font-size: 12px;
          color: #64748B;
          border-top: 1px solid #1E293B;
          background-color: #080B13;
        }
        .footer a {
          color: #00F0FF;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="card">
          <div class="header">
            <a href="https://gamio.com" class="logo">🎮 <span>Gamio</span></a>
          </div>
          <div class="content">
            ${bodyContent}
            ${ctaHtml}
          </div>
          <div class="footer">
            <p style="font-size: 12px; margin: 0 0 10px 0; color: #64748B;">Recibiste este correo porque estás registrado en la comunidad de Gamio.</p>
            <p style="font-size: 12px; margin: 0; color: #64748B;">© ${new Date().getFullYear()} Gamio. Todos los derechos reservados. <a href="https://gamio.com/contacto">Soporte técnico</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envía un correo de bienvenida cuando un usuario se registra.
 */
export async function sendWelcomeEmail(toEmail: string, username: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;

  const subject = '🎮 ¡Bienvenido a Gamio! Tu cuenta ha sido creada correctamente';
  
  const bodyContent = `
    <h2>¡Hola, ${username}!</h2>
    <p>¡Te damos una calurosa bienvenida a <strong>Gamio</strong>! Tu cuenta ha sido creada con total éxito.</p>
    <p>Gamio es la plataforma definitiva diseñada por y para gamers. Aquí podrás conectar con la comunidad, estar al día con las últimas noticias de la industria, debatir en los lóbiles de chat en tiempo real y conseguir recompensas estéticas geniales para lucir en tu perfil.</p>
    <p>Para empezar tu aventura y ver los juegos disponibles en nuestra web, pulsa en el siguiente enlace:</p>
  `;

  const ctaHtml = `
    <div class="cta-container">
      <a href="https://gamio.com" class="btn-neon">Entrar a Gamio 🚀</a>
    </div>
  `;

  const html = getEmailHTMLWrapper(subject, bodyContent, ctaHtml);

  try {
    await transporter.sendMail({
      from: `"Gamio" <${EMAIL_USER}>`,
      to: toEmail,
      subject,
      html
    });
    console.log(`📧 Correo de bienvenida enviado correctamente a: ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al enviar correo de bienvenida a ${toEmail}:`, error);
    return false;
  }
}

/**
 * Envía un recordatorio de que la recompensa diaria está disponible.
 */
export async function sendDailyRewardEmail(toEmail: string, username: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;

  const subject = '✨ ¡Tu Recompensa Diaria de Gamio está lista para reclamar!';
  
  const bodyContent = `
    <h2>¡Hola, ${username}!</h2>
    <p>¡Es hora de conseguir puntos gratis! Han pasado más de 24 horas desde tu última recompensa.</p>
    <p>Tu <strong>Recompensa Diaria</strong> ya está 100% disponible para ser reclamada. No pierdas la oportunidad de obtener tus <strong>+25 Puntos</strong> y <strong>+25 XP</strong> totalmente gratis.</p>
    <p>Acumula puntos para canjearlos por espectaculares marcos de avatar animados, fondos de perfil exclusivos y títulos prestigiosos en nuestra tienda de premios.</p>
  `;

  const ctaHtml = `
    <div class="cta-container">
      <a href="https://gamio.com/premios" class="btn-neon">Reclamar Recompensa 🎁</a>
    </div>
  `;

  const html = getEmailHTMLWrapper(subject, bodyContent, ctaHtml);

  try {
    await transporter.sendMail({
      from: `"Gamio" <${EMAIL_USER}>`,
      to: toEmail,
      subject,
      html
    });
    console.log(`📧 Correo de recompensa diaria enviado correctamente a: ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al enviar correo de recompensa diaria a ${toEmail}:`, error);
    return false;
  }
}
