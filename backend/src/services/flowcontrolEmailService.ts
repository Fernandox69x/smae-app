import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un estado de cuenta (recordatorio de pago o detalle de deuda) - Módulo FlowControl
 */
export async function sendStatementEmail(
  to: string,
  subject: string,
  data: {
    personName: string;
    message?: string;
    items: Array<{ description: string; amount: number; date: string }>;
    total: number;
    userName: string;
    userEmail?: string;
    userPhone?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px;">${item.description}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; color: #71717a">${item.date}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; text-align: right; font-weight: 600;">C$ ${item.amount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const contactHtml = `
      <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; font-size: 13px; color: #52525b;">
        <p style="margin-top: 0; margin-bottom: 12px; font-weight: bold; color: #18181b;">Datos de contacto:</p>
        <div><strong>Remitente:</strong> ${data.userName}</div>
        ${data.userEmail ? `<div><strong>Email:</strong> ${data.userEmail}</div>` : ''}
        ${data.userPhone ? `<div><strong>WhatsApp/Tel:</strong> ${data.userPhone}</div>` : ''}
      </div>
    `;

    const { error } = await resend.emails.send({
      from: 'FlowControl <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { border-bottom: 2px solid #f4f4f5; padding-bottom: 24px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: bold; color: #10b981; margin-bottom: 8px; }
            .header-title { font-size: 18px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; }
            h1 { font-size: 22px; margin-bottom: 16px; }
            .message-box { background: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px; color: #334155; font-style: italic; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { text-align: left; font-size: 12px; color: #71717a; text-transform: uppercase; padding-bottom: 12px; border-bottom: 1px solid #f4f4f5; }
            .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎯 FlowControl</div>
              <div class="header-title">Estado de Cuenta</div>
            </div>
            <h1>Hola, ${data.personName}</h1>
            <p><strong>${data.userName}</strong> te ha enviado el detalle de tu estado de cuenta.</p>
            ${data.message ? `<div class="message-box">"${data.message}"</div>` : ''}
            <table>
              <thead>
                <tr>
                  <th style="text-align: left; font-size: 12px; color: #71717a; text-transform: uppercase; padding-bottom: 12px; border-bottom: 1px solid #f4f4f5;">Descripción</th>
                  <th style="text-align: left; font-size: 12px; color: #71717a; text-transform: uppercase; padding-bottom: 12px; border-bottom: 1px solid #f4f4f5;">Fecha</th>
                  <th style="text-align: right; font-size: 12px; color: #71717a; text-transform: uppercase; padding-bottom: 12px; border-bottom: 1px solid #f4f4f5;">Monto (C$)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr>
                  <td colspan="2" style="padding-top: 24px; font-size: 16px; font-weight: bold;">TOTAL PENDIENTE</td>
                  <td style="padding-top: 24px; font-size: 20px; color: #10b981; text-align: right; font-weight: 800;">C$ ${data.total.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
            ${contactHtml}
            <div class="footer">
              Este es un correo automático generado por FlowControl.<br>
              © ${new Date().getFullYear()}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error enviando estado de cuenta:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en servicio de email FlowControl:', err);
    return { success: false, error: 'Error al enviar email' };
  }
}

/**
 * Envía una confirmación de pago de préstamo
 */
export async function sendLoanPaymentConfirmation(
  to: string,
  data: {
    loanName: string;
    paymentDate: string;
    amount: number;
    currency: string;
    principalPaid: number;
    interestPaid: number;
    feesPaid: number;
    newBalance: number;
    isExtraPayment: boolean;
    userName: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: 'FlowControl <onboarding@resend.dev>',
      to: [to],
      subject: `✓ Pago registrado: ${data.loanName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; margin-bottom: 24px; }
            .badge-success { background: #dcfce7; color: #166534; }
            .badge-extra { background: #fef9c3; color: #854d0e; }
            h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0f172a; }
            .amount-card { background: #f1f5f9; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }
            .amount-val { font-size: 32px; font-weight: 900; color: #10b981; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="badge ${data.isExtraPayment ? 'badge-extra' : 'badge-success'}">
              ${data.isExtraPayment ? '⭐ ADELANTO A CAPITAL' : '✓ CUOTA PAGADA'}
            </div>
            <h1>${data.loanName}</h1>
            <p style="color: #64748b; margin-bottom: 0;">Confirmación de pago recibida</p>
            
            <div class="amount-card">
              <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Monto Total</div>
              <div class="amount-val">${data.currency} ${data.amount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Fecha: ${data.paymentDate}</div>
            </div>

            <div style="margin-bottom: 24px;">
              <div class="detail-row">
                <span style="color: #64748b;">Abono a Capital</span>
                <span style="font-weight: 600;">+ ${data.currency} ${data.principalPaid.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span style="color: #64748b;">Intereses Pagados</span>
                <span style="color: #ef4444;">- ${data.currency} ${data.interestPaid.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span style="color: #64748b;">Seguros y Comisiones</span>
                <span style="color: #ef4444;">- ${data.currency} ${data.feesPaid.toLocaleString()}</span>
              </div>
              <div class="detail-row" style="border-bottom: 0; background: #fffbeb; margin-top: 8px; border-radius: 8px; padding: 12px;">
                <span style="font-weight: 700; color: #92400e;">Nuevo Saldo Deuda</span>
                <span style="font-weight: 800; color: #92400e;">${data.currency} ${data.newBalance.toLocaleString()}</span>
              </div>
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
              Excelente, <strong>${data.userName}</strong>. Mantener tus deudas al día es fundamental para tu salud financiera. 
              ${data.isExtraPayment ? 'Este adelanto te ayudará a ahorrar intereses en tus futuras cuotas.' : ''}
            </p>

            <div class="footer">
              Enviado desde SMAE App - Módulo FlowControl<br>
              © ${new Date().getFullYear()}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Error al enviar email de pago' };
  }
}
