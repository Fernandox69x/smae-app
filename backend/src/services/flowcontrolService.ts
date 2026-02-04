import { PrismaClient } from '@prisma/client';
import { sendStatementEmail } from './flowcontrolEmailService';

const prisma = new PrismaClient();

export class FlowControlService {
    /**
     * Elimina duplicados de transacciones recurrentes pendientes
     * (Misma plantilla y mismo día)
     */
    static async cleanupDuplicateRecurringTransactions(userId: string) {
        const pending = await prisma.transaction.findMany({
            where: {
                userId,
                status: 'pending',
                recurringTransactionId: { not: null }
            },
            orderBy: { dueDate: 'asc' }
        });

        const seen = new Set<string>();
        const toDelete: string[] = [];

        for (const tx of pending) {
            // Normalizar a fecha UTC para agrupar duplicados de forma consistente
            const dateStr = new Date(tx.dueDate).toISOString().split('T')[0];
            const key = `${tx.recurringTransactionId}_${dateStr}`;

            if (seen.has(key)) {
                toDelete.push(tx.id);
            } else {
                seen.add(key);
            }
        }

        if (toDelete.length > 0) {
            console.log(`[CLEANUP] Eliminando ${toDelete.length} duplicados para usuario ${userId}`);
            await prisma.transaction.deleteMany({
                where: { id: { in: toDelete } }
            });
        }
    }

    /**
     * Procesa las transacciones recurrentes y genera las instancias pendientes
     */
    static async processRecurringTransactions(userId: string) {
        // 1. Limpiar duplicados existentes primero
        await this.cleanupDuplicateRecurringTransactions(userId);

        const today = new Date();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const recurringTemplates = await prisma.recurringTransaction.findMany({
            where: { userId, isActive: true, nextDueDate: { lte: endOfMonth } }
        });

        if (recurringTemplates.length === 0) return;

        for (const template of recurringTemplates) {
            const instancesToCreate: Date[] = [];
            const currentTemplateDueDate = template.nextDueDate;
            let calculatingNextDue = new Date(template.nextDueDate);

            // Calcular todas las instancias hasta el fin de mes
            while (calculatingNextDue <= endOfMonth) {
                instancesToCreate.push(new Date(calculatingNextDue));

                const currentDue = new Date(calculatingNextDue);
                switch (template.frequency) {
                    case 'daily':
                        calculatingNextDue.setDate(currentDue.getDate() + 1);
                        break;
                    case 'weekly':
                        calculatingNextDue.setDate(currentDue.getDate() + 7);
                        break;
                    case 'biweekly':
                        calculatingNextDue.setDate(currentDue.getDate() + 14);
                        break;
                    case 'monthly':
                        calculatingNextDue.setMonth(currentDue.getMonth() + 1);
                        break;
                    case 'yearly':
                        calculatingNextDue.setFullYear(currentDue.getFullYear() + 1);
                        break;
                    default:
                        calculatingNextDue.setFullYear(currentDue.getFullYear() + 100);
                        break;
                }
            }

            // ATOMIC LOCK: Solo procedemos si ninguna otra instancia ha movido el nextDueDate
            const updateResult = await prisma.recurringTransaction.updateMany({
                where: { id: template.id, nextDueDate: currentTemplateDueDate },
                data: { nextDueDate: calculatingNextDue }
            });

            if (updateResult.count === 0) {
                console.log(`[RECURRING] Concurrencia detectada para template ${template.id}, saltando.`);
                continue;
            }

            // Hemos "ganado" el lock para generar estas instancias
            for (const instanceDate of instancesToCreate) {
                // Normalizar a medianoche UTC
                const normalizedDate = new Date(instanceDate);
                normalizedDate.setUTCHours(0, 0, 0, 0);

                const startOfDay = new Date(normalizedDate);
                const endOfDay = new Date(normalizedDate);
                endOfDay.setUTCHours(23, 59, 59, 999);

                const existingInstance = await prisma.transaction.findFirst({
                    where: {
                        recurringTransactionId: template.id,
                        dueDate: { gte: startOfDay, lte: endOfDay }
                    }
                });

                if (!existingInstance) {
                    await prisma.transaction.create({
                        data: {
                            userId: template.userId,
                            accountId: template.accountId,
                            categoryId: template.categoryId,
                            amount: template.amount,
                            currency: template.currency,
                            description: template.description,
                            dueDate: normalizedDate,
                            status: 'pending',
                            recurringTransactionId: template.id as any,
                            notes: 'Generado automáticamente (Recurrente)'
                        } as any
                    });
                }
            }
        }
    }

    /**
     * Elimina una plantilla recurrente y sus instancias pendientes
     */
    static async deleteRecurringTransactionTemplate(id: string, userId: string) {
        const template = await prisma.recurringTransaction.findFirst({
            where: { id, userId }
        });

        if (!template) throw new Error('Plantilla no encontrada');

        // 1. Eliminar instancias pendientes asociadas
        await prisma.transaction.deleteMany({
            where: {
                recurringTransactionId: id,
                status: 'pending'
            }
        });

        // 2. Eliminar la plantilla
        await prisma.recurringTransaction.delete({
            where: { id }
        });
    }

    /**
     * Obtiene el resumen financiero para el dashboard
     */
    static async getSummary(userId: string) {
        // Procesar transacciones recurrentes pendientes
        await this.processRecurringTransactions(userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Configuración de usuario
        let settings = await prisma.flowControlSettings.findUnique({
            where: { userId }
        });
        if (!settings) {
            settings = await prisma.flowControlSettings.create({
                data: { userId, exchangeRate: 36.50, displayCurrency: 'NIO' }
            });
        }
        const exchangeRate = Number(settings.exchangeRate);

        // Cuentas
        const accounts = await prisma.financialAccount.findMany({
            where: { userId, isActive: true }
        });

        // Transacciones este mes (para stats)
        const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const monthTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                status: 'applied',
                appliedAt: { gte: firstDayMonth, lt: nextMonth }
            },
            include: { category: true }
        });

        const incomeThisMonth = monthTransactions
            .filter(tx => Number(tx.amount) > 0)
            .reduce((sum, tx) => sum + this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate)), 0);

        const expenseThisMonth = monthTransactions
            .filter(tx => Number(tx.amount) < 0)
            .reduce((sum, tx) => sum + Math.abs(this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate))), 0);

        // Distribución por categoría (Gastos)
        const categoryGroups: Record<string, { value: number; color: string }> = {};
        monthTransactions
            .filter(tx => Number(tx.amount) < 0)
            .forEach(tx => {
                const catName = (tx as any).category?.name || 'Varios';
                const catColor = (tx as any).category?.color || '#94a3b8';
                const amountNio = Math.abs(this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate)));

                if (!categoryGroups[catName]) {
                    categoryGroups[catName] = { value: 0, color: catColor };
                }
                categoryGroups[catName].value += amountNio;
            });

        const categoryDistribution = Object.entries(categoryGroups).map(([name, data]) => ({
            name,
            value: data.value,
            color: data.color
        })).sort((a, b) => b.value - a.value);

        // Cuentas por cobrar/pagar
        const receivables = await prisma.receivable.findMany({
            where: { userId, status: { in: ['pending', 'partial'] } }
        });

        const totalReceivable = receivables
            .filter(r => r.type === 'receivable')
            .reduce((sum, r) => sum + this.convertToNio(Number(r.amount) - Number(r.paidAmount), r.currency, exchangeRate), 0);

        const totalPayable = receivables
            .filter(r => r.type === 'payable')
            .reduce((sum, r) => sum + this.convertToNio(Number(r.amount) - Number(r.paidAmount), r.currency, exchangeRate), 0);

        // --- Weekly & Monthly Preview ---
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);

        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const pendingTxs = await prisma.transaction.findMany({
            where: { userId, status: 'pending' }
        });

        const next7DaysIncome = pendingTxs
            .filter(tx => tx.dueDate >= today && tx.dueDate <= next7Days && Number(tx.amount) > 0)
            .reduce((sum, tx) => sum + this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate)), 0);

        const next7DaysExpense = pendingTxs
            .filter(tx => tx.dueDate >= today && tx.dueDate <= next7Days && Number(tx.amount) < 0)
            .reduce((sum, tx) => sum + Math.abs(this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate))), 0);

        const remainingMonthIncome = pendingTxs
            .filter(tx => tx.dueDate >= today && tx.dueDate <= endOfMonth && Number(tx.amount) > 0)
            .reduce((sum, tx) => sum + this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate)), 0);

        const remainingMonthExpense = pendingTxs
            .filter(tx => tx.dueDate >= today && tx.dueDate <= endOfMonth && Number(tx.amount) < 0)
            .reduce((sum, tx) => sum + Math.abs(this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate))), 0);

        // Préstamos
        const activeLoans = await (prisma as any).loan.findMany({
            where: { userId, status: 'active' }
        });

        const totalLoanDebt = activeLoans.reduce((sum: number, l: any) =>
            sum + this.convertToNio(Number(l.currentBalance), l.currency, exchangeRate), 0);

        const monthlyLoanCommitment = activeLoans.reduce((sum: number, l: any) =>
            sum + this.convertToNio(Number(l.monthlyPayment), l.currency, exchangeRate), 0);

        // Saldo Real (Suma de balances de cuentas NIO + USD convertidos)
        const realBalance = accounts.reduce((sum, acc) => {
            if (acc.type === 'credit') {
                // Para tarjetas de crédito, el balance real en efectivo no se ve afectado directamente, 
                // pero si restamos lo usado tendríamos una visión de "neto". 
                // Sin embargo, usualmente el Saldo Real = Efectivo + Débito.
                return sum;
            }
            return sum + this.convertToNio(Number(acc.balance), acc.currency, exchangeRate);
        }, 0);

        // Saldo Proyectado (Real + Transacciones pendientes)
        const pendingTransactions = await prisma.transaction.findMany({
            where: { userId, status: 'pending' }
        });

        const projectedBalance = pendingTransactions.reduce((sum, tx) => {
            return sum + this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate));
        }, realBalance);

        // Cuentas formateadas para el dashboard
        const formattedAccounts = accounts.map(acc => ({
            ...acc,
            balance: Number(acc.balance),
            usedCredit: Number(acc.usedCredit),
            creditLimit: acc.creditLimit ? Number(acc.creditLimit) : null,
            availableCredit: acc.type === 'credit' && acc.creditLimit
                ? Number(acc.creditLimit) - Number(acc.usedCredit)
                : null
        }));

        return {
            realBalance,
            projectedBalance,
            incomeThisMonth,
            expenseThisMonth,
            totalReceivable,
            totalPayable,
            totalLoanDebt,
            monthlyLoanCommitment,
            next7DaysIncome,
            next7DaysExpense,
            remainingMonthIncome,
            remainingMonthExpense,
            categoryDistribution,
            displayCurrency: settings.displayCurrency,
            exchangeRate,
            accounts: formattedAccounts
        };
    }

    /**
     * Obtiene notificaciones y alertas de flujo
     */
    static async getNotifications(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dueToday = await prisma.transaction.findMany({
            where: { userId, status: 'pending', dueDate: { gte: today, lt: tomorrow } },
            include: { category: { select: { name: true } } }
        });

        const overdue = await prisma.transaction.findMany({
            where: { userId, status: 'pending', dueDate: { lt: today } },
            include: { category: { select: { name: true } } }
        });

        // Low balance alert (next 7 days)
        const next7Days = new Date();
        next7Days.setDate(next7Days.getDate() + 7);
        const upcoming = await prisma.transaction.findMany({
            where: { userId, status: 'pending', dueDate: { gte: today, lte: next7Days } }
        });

        const accounts = await prisma.financialAccount.findMany({ where: { userId, isActive: true } });
        const currentBalance = accounts.reduce((sum, acc) => {
            if (acc.type === 'credit') return sum;
            return sum + Number(acc.balance);
        }, 0);

        let projectedBalance = currentBalance;
        upcoming.forEach(tx => { projectedBalance += Number(tx.amount); });

        return {
            dueToday,
            overdue,
            lowBalanceAlert: projectedBalance < 0,
            projectedBalance,
            currentBalance
        };
    }

    /**
     * Elimina una transacción y revierte su impacto en el saldo si estaba aplicada
     */
    static async deleteTransaction(id: string, userId: string) {
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId }
        });

        if (!transaction) throw new Error('Transacción no encontrada');

        // Revertir balance si estaba aplicada
        if (transaction.status === 'applied' && transaction.accountId) {
            await this.updateAccountBalance(
                transaction.accountId,
                Number(transaction.amount),
                false,
                transaction.currency,
                transaction.exchangeRate ? Number(transaction.exchangeRate) : undefined
            );
        }

        await prisma.transaction.delete({
            where: { id }
        });
    }

    /**
     * Cambia el estado de una transacción (Aplicada <-> Pendiente)
     * Maneja la actualización de saldos de cuenta
     */
    static async toggleTransactionStatus(id: string, userId: string) {
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId }
        });

        if (!transaction) throw new Error('Transacción no encontrada');

        const newStatus = transaction.status === 'applied' ? 'pending' : 'applied';
        const appliedAt = newStatus === 'applied' ? new Date() : null;

        const updated = await prisma.transaction.update({
            where: { id },
            data: { status: newStatus, appliedAt }
        });

        if (transaction.accountId) {
            await this.updateAccountBalance(
                transaction.accountId,
                Number(transaction.amount),
                newStatus === 'applied',
                transaction.currency,
                transaction.exchangeRate ? Number(transaction.exchangeRate) : undefined
            );
        }

        return updated;
    }

    /**
     * Actualiza una transacción y ajusta los saldos si es necesario
     */
    static async updateTransaction(id: string, userId: string, data: any) {
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId }
        });

        if (!transaction) throw new Error('Transacción no encontrada');

        const { amount, accountId, status, dueDate, description, categoryId, notes } = data;

        // Si la transacción ya estaba aplicada, revertimos su impacto antes de actualizar
        if (transaction.status === 'applied' && transaction.accountId) {
            await this.updateAccountBalance(
                transaction.accountId,
                Number(transaction.amount),
                false,
                transaction.currency,
                transaction.exchangeRate ? Number(transaction.exchangeRate) : undefined
            );
        }

        // Actualizar transacción
        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                amount: amount !== undefined ? Number(amount) : undefined,
                accountId: accountId !== undefined ? accountId : undefined,
                status: status !== undefined ? status : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                description: description !== undefined ? description : undefined,
                categoryId: categoryId !== undefined ? categoryId : undefined,
                notes: notes !== undefined ? notes : undefined,
                appliedAt: status === 'applied' ? (transaction.appliedAt || new Date()) : (status === 'pending' ? null : undefined)
            }
        });

        // Si el NUEVO estado es aplicado, aplicamos el impacto al balance
        if (updated.status === 'applied' && updated.accountId) {
            await this.updateAccountBalance(
                updated.accountId,
                Number(updated.amount),
                true,
                updated.currency,
                updated.exchangeRate ? Number(updated.exchangeRate) : undefined
            );
        }

        return updated;
    }

    /**
     * Crea una transferencia entre cuentas
     */
    static async createTransfer(data: any, userId: string) {
        const { fromAccountId, toAccountId, amountFrom, amountTo, exchangeRate, description } = data;

        const [fromAccount, toAccount] = await Promise.all([
            prisma.financialAccount.findUnique({ where: { id: fromAccountId } }),
            prisma.financialAccount.findUnique({ where: { id: toAccountId } })
        ]);

        if (!fromAccount || !toAccount) throw new Error('Cuentas no encontradas');
        if (fromAccount.userId !== userId || toAccount.userId !== userId) throw new Error('No autorizado');

        const transfer = await prisma.accountTransfer.create({
            data: {
                userId,
                fromAccountId,
                toAccountId,
                amountFrom,
                amountTo: amountTo || amountFrom,
                exchangeRate: exchangeRate || null,
                description
            }
        });

        // Update balances
        // Salida
        await this.updateAccountBalance(fromAccountId, -Number(amountFrom), true);
        // Entrada
        await this.updateAccountBalance(toAccountId, Number(amountTo || amountFrom), true);

        return transfer;
    }

    /**
     * Liquida una cuenta por cobrar/pagar (total o parcialmente) y crea la transacción asociada
     */
    static async settleReceivable(id: string, userId: string, data: { accountId?: string, paidAmount?: number }) {
        const { accountId, paidAmount } = data;

        const receivable = await prisma.receivable.findFirst({
            where: { id, userId }
        });

        if (!receivable) throw new Error('No encontrado');

        const newPaidAmount = Number(receivable.paidAmount) + Number(paidAmount || receivable.amount);
        const isFullyPaid = newPaidAmount >= Number(receivable.amount);

        // Actualizar receivable
        const updated = await prisma.receivable.update({
            where: { id },
            data: {
                paidAmount: newPaidAmount,
                status: isFullyPaid ? 'paid' : 'partial',
                settledAt: isFullyPaid ? new Date() : null
            }
        });

        // Crear transacción si se especificó cuenta
        if (accountId) {
            const amount = receivable.type === 'receivable'
                ? (paidAmount || Number(receivable.amount)) // Cobro = ingreso
                : -(paidAmount || Number(receivable.amount)); // Pago = egreso

            await prisma.transaction.create({
                data: {
                    userId,
                    accountId,
                    amount,
                    description: `Pago ${receivable.type === 'receivable' ? 'de' : 'a'} ${receivable.personName}`,
                    dueDate: new Date(),
                    status: 'applied',
                    appliedAt: new Date()
                }
            });

            // Actualizar saldo de cuenta
            await this.updateAccountBalance(accountId, amount, true);
        }

        return updated;
    }

    /**
     * Genera datos para el gráfico de proyección
     */
    static async getChartData(userId: string, days: number = 30) {
        // Asegurar transacciones recurrentes generadas
        await this.processRecurringTransactions(userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const accounts = await prisma.financialAccount.findMany({
            where: { userId, isActive: true }
        });

        // Settings for conversion
        const settings = await prisma.flowControlSettings.findUnique({ where: { userId } });
        const exchangeRate = Number(settings?.exchangeRate || 36.50);

        // Initial combined balance in NIO
        let currentBalance = accounts.reduce((sum, acc) => {
            if (acc.type === 'credit') return sum;
            return sum + this.convertToNio(Number(acc.balance), acc.currency, exchangeRate);
        }, 0);

        // Pending transactions ordered by date
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + days);

        const pending = await prisma.transaction.findMany({
            where: {
                userId,
                status: 'pending',
                dueDate: { gte: today, lte: endDate }
            },
            orderBy: { dueDate: 'asc' }
        });

        const activeLoans = await (prisma as any).loan.findMany({
            where: { userId, status: 'active' }
        });

        const chartData = [];
        let runningBalance = currentBalance;

        // Current start point
        chartData.push({
            date: today.toISOString().split('T')[0],
            balance: Math.round(runningBalance)
        });

        // Project day by day
        for (let i = 1; i <= days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            // Add transactions for this day
            const daysTxs = pending.filter(tx => {
                const txDate = new Date(tx.dueDate);
                return txDate.toISOString().split('T')[0] === dateStr;
            });

            daysTxs.forEach(tx => {
                runningBalance += this.convertToNio(Number(tx.amount), tx.currency, Number(tx.exchangeRate || exchangeRate));
            });

            // Restar pagos de préstamos si coincide el día Y el préstamo ya comenzó a cobrarse
            activeLoans.forEach(loan => {
                const firstPayment = (loan as any).firstPaymentDate ? new Date((loan as any).firstPaymentDate) : null;
                const isAfterOrEqualFirstPayment = !firstPayment ||
                    (date.getFullYear() > firstPayment.getFullYear()) ||
                    (date.getFullYear() === firstPayment.getFullYear() && date.getMonth() >= firstPayment.getMonth());

                if (date.getDate() === loan.paymentDay && isAfterOrEqualFirstPayment) {
                    runningBalance -= this.convertToNio(Number(loan.monthlyPayment), loan.currency, exchangeRate);
                }
            });

            chartData.push({
                date: dateStr,
                balance: Math.round(runningBalance)
            });
        }

        return chartData;
    }

    /**
     * Reutiliza el servicio de email específico de FlowControl
     */
    static async sendStatement(userId: string, targetData: any) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true }
        });

        if (!user) throw new Error('Usuario no encontrado');

        const { to, subject, personName, message, items, total, includeEmail, includePhone, customPhone } = targetData;

        return await sendStatementEmail(to, subject || 'Estado de Cuenta', {
            personName: personName || 'Cliente',
            message,
            items: items.map((item: any) => ({
                description: item.description,
                amount: Number(item.amount),
                date: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Sin fecha'
            })),
            total: Number(total),
            userName: user.name || 'Usuario de S.M.A.E.',
            userEmail: includeEmail ? user.email : undefined,
            userPhone: includePhone ? (customPhone || 'No proporcionado') : undefined
        });
    }

    // --- Helpers ---

    private static convertToNio(amount: number, currency: string, rate: number): number {
        return currency === 'USD' ? amount * rate : amount;
    }

    /**
     * Helper para actualizar el balance de una cuenta
     */
    public static async updateAccountBalance(
        accountId: string,
        amount: number,
        apply: boolean = true,
        transactionCurrency?: string,
        exchangeRate?: number
    ) {
        const account = await prisma.financialAccount.findUnique({ where: { id: accountId } });
        if (!account) return;

        // Si la moneda es diferente, aplicar conversión
        let finalAmount = Number(amount);
        if (transactionCurrency && transactionCurrency !== account.currency) {
            if (transactionCurrency === 'USD' && account.currency === 'NIO') {
                // USD a NIO
                const rate = exchangeRate || 36.50;
                finalAmount = Number(amount) * rate;
            } else if (transactionCurrency === 'NIO' && account.currency === 'USD') {
                // NIO a USD
                const rate = exchangeRate || 36.50;
                finalAmount = Number(amount) / rate;
            }
        }

        const delta = apply ? finalAmount : -finalAmount;

        if (account.type === 'credit' && finalAmount < 0) {
            // Gasto en tarjeta de crédito afecta usedCredit
            const creditUpdate = apply ? Math.abs(finalAmount) : -Math.abs(finalAmount);
            await prisma.financialAccount.update({
                where: { id: accountId },
                data: { usedCredit: { increment: creditUpdate } }
            });
        } else {
            // Cuentas normales o ingresos en tarjeta
            await prisma.financialAccount.update({
                where: { id: accountId },
                data: { balance: { increment: delta } }
            });
        }
    }
}
