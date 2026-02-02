import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Envía un email de recuperación de contraseña
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  try {
    const { error } = await resend.emails.send({
      from: 'S.M.A.E. <onboarding@resend.dev>', // Cambiar por tu dominio verificado
      to: [to],
      subject: 'Recupera tu contraseña - S.M.A.E.',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
            .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .logo { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; margin-bottom: 24px; }
            h1 { color: #18181b; font-size: 20px; margin-bottom: 16px; }
            p { color: #52525b; line-height: 1.6; }
            .btn { display: inline-block; background: #10b981; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
            .btn:hover { background: #059669; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #a1a1aa; text-align: center; }
            .warning { background: #fef3c7; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 14px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🎯 S.M.A.E.</div>
            <h1>Hola${userName ? ` ${userName}` : ''},</h1>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <center>
              <a href="${resetUrl}" class="btn">Restablecer Contraseña</a>
            </center>
            <div class="warning">
              ⏰ Este enlace expirará en <strong>1 hora</strong>.
            </div>
            <p style="margin-top: 24px;">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña seguirá siendo la misma.</p>
            <div class="footer">
              © ${new Date().getFullYear()} S.M.A.E. - Sistema de Maestría y Aprendizaje Efectivo
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en servicio de email:', err);
    return { success: false, error: 'Error al enviar email' };
  }
}

/**
 * Envía un email avisando que el cooldown de 48h ha terminado
 */
export async function sendCooldownEndEmail(
  to: string,
  skillName: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: 'S.M.A.E. <onboarding@resend.dev>',
      to: [to],
      subject: '¡Hora de consolidar! - S.M.A.E.',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; color: white; }
            .container { max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 15px rgba(0,0,0,0.3); border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; margin-bottom: 24px; }
            h1 { color: #f8fafc; font-size: 20px; margin-bottom: 16px; }
            p { color: #94a3b8; line-height: 1.6; }
            .skill-badge { display: inline-block; background: #10b98120; color: #10b981; padding: 4px 12px; border-radius: 16px; font-weight: bold; border: 1px solid #10b98140; margin: 10px 0; }
            .btn { display: inline-block; background: #10b981; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🎯 S.M.A.E.</div>
            <h1>¡Felicidades${userName ? ` ${userName}` : ''}!</h1>
            <p>Han pasado las <strong>48 horas</strong> de incubación necesarias para consolidar tu conocimiento.</p>
            <center>
              <div class="skill-badge">${skillName}</div>
              <p>Tu cerebro ha procesado la información. Es el momento perfecto para la prueba final y alcanzar el <strong>Nivel 4 (Consolidación)</strong>.</p>
              <a href="${FRONTEND_URL}" class="btn">Entrar y Validar</a>
            </center>
            <div class="footer">
              Anti-Autoengaño: Si no lo recuerdas, usa el botón de pánico. <br>
              © ${new Date().getFullYear()} S.M.A.E.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error enviando email de cooldown:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en servicio de email:', err);
    return { success: false, error: 'Error al enviar email' };
  }
}

/**
 * Envía un email de contacto desde el formulario del portfolio
 */
export async function sendContactEmail(
  senderName: string,
  senderEmail: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // Email al que quieres recibir los mensajes de contacto
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'tu@email.com';

  try {
    const { error } = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: [CONTACT_EMAIL],
      replyTo: senderEmail,
      subject: `[Portfolio] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(to right, #10b981, #06b6d4); color: white; padding: 24px; border-radius: 12px 12px 0 0; margin: -32px -32px 24px -32px; }
            .header h1 { margin: 0; font-size: 20px; }
            .field { margin-bottom: 16px; }
            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
            .value { color: #18181b; font-size: 16px; }
            .message { background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 Nuevo mensaje de contacto</h1>
            </div>
            
            <div class="field">
              <div class="label">De</div>
              <div class="value"><strong>${senderName}</strong> (${senderEmail})</div>
            </div>
            
            <div class="field">
              <div class="label">Asunto</div>
              <div class="value">${subject}</div>
            </div>
            
            <div class="field">
              <div class="label">Mensaje</div>
              <div class="message">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="footer">
              Recibido desde tu Portfolio - ${new Date().toLocaleString('es-ES')}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error enviando email de contacto:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en servicio de email:', err);
    return { success: false, error: 'Error al enviar email' };
  }
}




