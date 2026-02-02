import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export class BriefingService {
    static async sendWeeklyBriefings() {
        try {
            const users = await prisma.user.findMany({
                where: { email: { not: '' } }
            });

            for (const user of users) {
                await this.sendUserBriefing(user);
            }
        } catch (error) {
            console.error('[BriefingService] Error en envío masivo:', error);
        }
    }

    private static async sendUserBriefing(user: any) {
        try {
            const userId = user.id;
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);

            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            // 1. Obtener transacciones de la última semana
            const recentTransactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    status: 'applied',
                    dueDate: { gte: lastWeek }
                }
            });

            const income = recentTransactions
                .filter(tx => Number(tx.amount) > 0)
                .reduce((acc, tx) => acc + Number(tx.amount), 0);

            const expenses = recentTransactions
                .filter(tx => Number(tx.amount) < 0)
                .reduce((acc, tx) => acc + Math.abs(Number(tx.amount)), 0);

            // 2. Obtener pagos de préstamos próximos
            const upcomingPayments = await prisma.loanPayment.findMany({
                where: {
                    loan: { userId, status: 'active' },
                    paymentDate: { gte: new Date(), lte: nextWeek }
                },
                include: { loan: true }
            });

            // 3. Obtener balance general aproximado
            const accounts = await prisma.financialAccount.findMany({
                where: { userId, isActive: true }
            });

            const totalBalanceNIO = accounts
                .filter(acc => acc.currency === 'NIO')
                .reduce((acc, accnt) => acc + Number(accnt.balance), 0);

            // 4. Enviar Email
            const { error } = await resend.emails.send({
                from: 'S.M.A.E. <onboarding@resend.dev>',
                to: [user.email],
                subject: `📊 Tu Resumen Semanal Financiero - S.M.A.E.`,
                html: this.generateHtml(user.name || 'Usuario', {
                    income,
                    expenses,
                    upcomingPayments,
                    totalBalanceNIO
                })
            });

            if (error) throw error;

        } catch (error) {
            console.error(`[BriefingService] Error procesando usuario ${user.email}:`, error);
        }
    }

    private static generateHtml(name: string, data: any) {
        const { income, expenses, upcomingPayments, totalBalanceNIO } = data;

        const paymentsHtml = upcomingPayments.length > 0
            ? upcomingPayments.map((p: any) => `
                <div style="padding: 10px; border-left: 4px solid #f59e0b; background: #fffbeb; margin-bottom: 8px;">
                    <strong>${p.loan.name}</strong><br>
                    <span style="font-size: 12px; color: #78350f;">Vence: ${new Date(p.paymentDate).toLocaleDateString()}</span><br>
                    <span style="font-weight: bold; color: #b45309;">${p.loan.currency} ${p.totalAmount.toLocaleString()}</span>
                </div>
            `).join('')
            : '<p style="color: #6b7280; italic">No hay pagos programados para esta semana.</p>';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; margin: 0; padding: 20px; }
                    .card { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    .header { text-align: center; margin-bottom: 32px; }
                    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
                    .stat-box { padding: 20px; border-radius: 12px; text-align: center; }
                    .income { background: #ecfdf5; color: #065f46; }
                    .expense { background: #fef2f2; color: #991b1b; }
                    .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; border-bottom: 2px solid #f3f4f6; padding-bottom: 4px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <div style="font-size: 24px; margin-bottom: 8px;">🎯 S.M.A.E.</div>
                        <h2 style="margin: 0;">¡Hola, ${name}!</h2>
                        <p style="color: #6b7280;">Aquí tienes el resumen de tu actividad financiera la última semana.</p>
                    </div>

                    <div class="section-title">Actividad de la Semana</div>
                    <div style="display: table; width: 100%; margin-bottom: 32px;">
                        <div style="display: table-cell; width: 48%; background: #ecfdf5; padding: 20px; border-radius: 12px; text-align: center;">
                            <span style="font-size: 12px; color: #065f46; font-weight: bold;">INGRESOS</span><br>
                            <span style="font-size: 20px; font-weight: 900;">C$ ${income.toLocaleString()}</span>
                        </div>
                        <div style="display: table-cell; width: 4%;"></div>
                        <div style="display: table-cell; width: 48%; background: #fef2f2; padding: 20px; border-radius: 12px; text-align: center;">
                            <span style="font-size: 12px; color: #991b1b; font-weight: bold;">GASTOS</span><br>
                            <span style="font-size: 20px; font-weight: 900;">C$ ${expenses.toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="section-title">Próximos Pagos de Préstamos</div>
                    <div style="margin-bottom: 32px;">
                        ${paymentsHtml}
                    </div>

                    <div style="background: #eff6ff; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #bfdbfe;">
                        <span style="font-size: 11px; color: #1e40af; font-weight: bold;">BALANCE ESTIMADO EN C$</span><br>
                        <span style="font-size: 24px; font-weight: 900; color: #1e3a8a;">C$ ${totalBalanceNIO.toLocaleString()}</span>
                    </div>

                    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                        Este es un correo automático generado por tu plataforma S.M.A.E.<br>
                        &copy; ${new Date().getFullYear()} S.M.A.E. FlowControl
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}
