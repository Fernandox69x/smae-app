import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../index';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export class AIAdvisorService {
    private static model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    /**
     * Realiza una auditoría financiera completa del usuario
     */
    static async getFinancialAdvice(userId: string) {
        // 1. Recopilar datos relevantes
        const [transactions, loans, shoppingItems] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId },
                orderBy: { dueDate: 'desc' },
                take: 50,
                include: { category: true }
            }),
            prisma.loan.findMany({
                where: { userId },
                include: { payments: { take: 5, orderBy: { paymentDate: 'desc' } } }
            }),
            prisma.shoppingItem.findMany({
                where: { userId },
                include: { history: { take: 3, orderBy: { purchaseDate: 'desc' } } }
            })
        ]);

        // 2. Preparar contexto para la IA
        const context = {
            recentTransactions: transactions.map((t: any) => ({
                desc: t.description,
                amount: t.amount,
                currency: t.currency,
                category: t.category?.name,
                type: t.type,
                date: t.dueDate
            })),
            activeLoans: loans.map((l: any) => ({
                name: l.name,
                balance: l.currentBalance,
                rate: l.interestRate,
                monthly: l.monthlyPayment,
                remaining: l.remainingMonths,
                currency: l.currency
            })),
            pantrySummary: shoppingItems.map((i: any) => ({
                name: i.name,
                inStock: i.isInStock,
                lastPrice: i.history[0]?.price,
                store: i.history[0]?.store
            }))
        };

        const prompt = `
            Eres un Asesor Financiero Personal Inteligente de la plataforma FlowControl. 
            Tu misión es analizar los datos financieros del usuario y dar consejos accionables, honestos y motivadores.

            DATOS DEL USUARIO:
            ${JSON.stringify(context, null, 2)}

            INSTRUCCIONES:
            1. Analiza patrones de gastos (¿Hay gastos innecesarios? ¿Categorías disparadas?).
            2. Evalúa la salud de las deudas (¿Los préstamos son muy caros? ¿Sugerencia de abono extra?).
            3. Revisa la despensa (¿Hay productos que siempre compra caros? ¿Sugerencia de ahorro?).
            4. Da 3 consejos específicos ("Quick Wins") para mejorar su flujo de caja esta semana.

            IMPORTANTE:
            - Sé breve pero profundo.
            - Usa un tono profesional pero cercano.
            - Responde en formato JSON.

            ESTRUCTURA DE RESPUESTA:
            {
                "summary": "Resumen general de salud financiera (1 frase)",
                "analysis": {
                    "spending": "Análisis de gastos",
                    "debt": "Análisis de préstamos/deudas",
                    "shopping": "Análisis de despensa y precios"
                },
                "recommendations": [
                    { "title": "...", "description": "...", "priority": "high|medium|low" }
                ],
                "alert": "Si hay algo crítico (ej: deuda altísima), ponlo aquí. Si no, null."
            }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const cleanText = text.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Error in AIAdvisorService:', error);
            throw new Error('No se pudo generar el consejo financiero en este momento.');
        }
    }
}
