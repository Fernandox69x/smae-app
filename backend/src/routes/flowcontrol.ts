import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FlowControlService } from '../services/flowcontrolService';
import { LoanService } from '../services/loanService';
import { AIAdvisorService } from '../services/aiAdvisorService';

const prisma = new PrismaClient();
const router = Router();

// Middleware to extract user from JWT (assumed already authenticated)
const getUserId = (req: Request): string => {
    return (req as any).userId;  // Set by authMiddleware
};

// ============================================
// FINANCIAL ACCOUNTS
// ============================================

// GET all accounts
router.get('/accounts', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const accounts = await prisma.financialAccount.findMany({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'asc' }
        });

        // Calculate available credit for credit accounts
        const accountsWithAvailable = accounts.map(acc => ({
            ...acc,
            availableCredit: acc.type === 'credit' && acc.creditLimit
                ? Number(acc.creditLimit) - Number(acc.usedCredit)
                : null
        }));

        res.json(accountsWithAvailable);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Error al obtener cuentas' });
    }
});

// POST create account
router.post('/accounts', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { name, bank, type, currency, balance, creditLimit, color } = req.body;

        const account = await prisma.financialAccount.create({
            data: {
                userId,
                name,
                bank: bank || null,
                type,
                currency: currency || 'NIO',
                balance: balance || 0,
                creditLimit: type === 'credit' ? creditLimit : null,
                usedCredit: 0,
                color: color || '#6366f1'
            }
        });

        res.status(201).json(account);
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Error al crear cuenta' });
    }
});

// PUT update account
router.put('/accounts/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);
        const updates = req.body;

        const existing = await prisma.financialAccount.findFirst({ where: { id: String(id), userId } });
        if (!existing) return res.status(404).json({ error: 'Cuenta no encontrada' });
        const account = await prisma.financialAccount.update({
            where: { id: String(id) },
            data: updates
        });

        res.json(account);
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ error: 'Error al actualizar cuenta' });
    }
});

// DELETE account (soft delete)
router.delete('/accounts/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);

        const existing = await prisma.financialAccount.findFirst({ where: { id: String(id), userId } });
        if (!existing) return res.status(404).json({ error: 'Cuenta no encontrada' });
        await prisma.financialAccount.update({
            where: { id: String(id) },
            data: { isActive: false }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
});

// ============================================
// LOANS (Recurrent Debts)
// ============================================

// GET all loans
router.get('/loans', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const loans = await LoanService.getLoans(userId);
        res.json(loans);
    } catch (error) {
        console.error('Error fetching loans:', error);
        res.status(500).json({ error: 'Error al obtener préstamos' });
    }
});

// POST create loan
router.post('/loans', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const loan = await LoanService.createLoan(req.body, userId);
        res.status(201).json(loan);
    } catch (error: any) {
        console.error('Error creating loan:', error);
        res.status(500).json({ error: 'Error al crear préstamo' });
    }
});

// GET loan by ID
router.get('/loans/:id', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const loan = await LoanService.getLoanById(String(req.params.id), userId);
        res.json(loan);
    } catch (error: any) {
        console.error('Error fetching loan:', error);
        res.status(error.message === 'Préstamo no encontrado' ? 404 : 500).json({ error: error.message });
    }
});

// PUT update loan
router.put('/loans/:id', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const loanId = String(req.params.id);
        const result = await LoanService.updateLoan(loanId, userId, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error updating loan:', error);
        res.status(500).json({ error: error.message || 'Error al actualizar préstamo' });
    }
});

// DELETE loan
router.delete('/loans/:id', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        await LoanService.deleteLoan(String(req.params.id), userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting loan:', error);
        res.status(error.message === 'Préstamo no encontrado' ? 404 : 500).json({ error: error.message || 'Error al eliminar préstamo' });
    }
});

// DELETE loan payment (and revert balance)
router.delete('/loans/:id/payments/:paymentId', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        await LoanService.deletePayment(String(req.params.id), String(req.params.paymentId), userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting payment:', error);
        res.status(error.message === 'Pago no encontrado' ? 404 : 500).json({ error: error.message || 'Error al eliminar pago' });
    }
});

// POST record payment
router.post('/loans/:id/payments', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const result = await LoanService.recordPayment(String(req.params.id), userId, req.body);
        res.status(201).json(result);
    } catch (error: any) {
        console.error('Error recording loan payment:', error);
        res.status(500).json({ error: error.message || 'Error al registrar pago' });
    }
});

// GET amortization calculation
router.get('/loans/calculation/amortization', (req: Request, res: Response) => {
    try {
        const { principal, rate, months, insurance } = req.query;
        const schedule = LoanService.calculateAmortization(
            Number(principal),
            Number(rate),
            Number(months),
            Number(insurance || 0)
        );
        res.json(schedule);
    } catch (error) {
        res.status(400).json({ error: 'Parámetros inválidos' });
    }
});

// ============================================
// TRANSACTIONS
// ============================================

// GET all transactions with filters
router.get('/transactions', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        // Asegurar transacciones recurrentes generadas
        await FlowControlService.processRecurringTransactions(userId);

        const { status, startDate, endDate, accountId, categoryId } = req.query;

        const where: any = { userId };

        if (status) where.status = status;
        if (accountId) where.accountId = accountId;
        if (categoryId) where.categoryId = categoryId;
        if (startDate || endDate) {
            where.dueDate = {};
            if (startDate) where.dueDate.gte = new Date(startDate as string);
            if (endDate) where.dueDate.lte = new Date(endDate as string);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                account: { select: { name: true, type: true, color: true } },
                category: { select: { name: true, color: true, icon: true } }
            },
            orderBy: { dueDate: 'asc' }
        });

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Error al obtener transacciones' });
    }
});

// POST create transaction
router.post('/transactions', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { accountId, categoryId, amount, description, dueDate, isRecurring, recurrence, notes } = req.body;

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                accountId,
                categoryId,
                amount,
                currency: req.body.currency || 'NIO',
                exchangeRate: req.body.exchangeRate ? Number(req.body.exchangeRate) : null,
                description,
                dueDate: new Date(dueDate),
                isRecurring: isRecurring || false,
                recurrence,
                notes,
                status: 'pending'
            }
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Error al crear transacción' });
    }
});

// PUT update transaction
router.put('/transactions/:id', async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = String(getUserId(req));
        const result = await FlowControlService.updateTransaction(id, userId, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error updating transaction:', error);
        res.status(error.message === 'Transacción no encontrada' ? 404 : 500).json({ error: error.message || 'Error al actualizar transacción' });
    }
});

// PUT toggle transaction status (apply/unapply)
router.put('/transactions/:id/toggle', async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = String(getUserId(req));

        const updated = await FlowControlService.toggleTransactionStatus(id, userId);
        res.json(updated);
    } catch (error: any) {
        console.error('Error toggling transaction:', error);
        res.status(error.message === 'No autorizado' ? 403 : 500).json({ error: error.message || 'Error al cambiar estado' });
    }
});

// DELETE transaction
router.delete('/transactions/:id', async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = String(getUserId(req));

        await FlowControlService.deleteTransaction(id, userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting transaction:', error);
        res.status(error.message === 'Transacción no encontrada' ? 404 : 500).json({ error: error.message || 'Error al eliminar transacción' });
    }
});

// ============================================
// CATEGORIES
// ============================================

// GET all categories
router.get('/categories', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const categories = await prisma.transactionCategory.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// POST create category
router.post('/categories', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { name, type, color, icon, isFixed } = req.body;

        const category = await prisma.transactionCategory.create({
            data: { userId, name, type, color, icon, isFixed }
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Error al crear categoría' });
    }
});

// DELETE category
router.delete('/categories/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);

        const existing = await prisma.transactionCategory.findFirst({ where: { id: String(id), userId } });
        if (!existing) return res.status(404).json({ error: 'Categoría no encontrada' });
        await prisma.transactionCategory.delete({
            where: { id: String(id) }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

// ============================================
// RECURRING TRANSACTIONS (Templates)
// ============================================

// GET all recurring templates
router.get('/recurring-transactions', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const templates = await (prisma as any).recurringTransaction.findMany({
            where: { userId },
            include: {
                account: { select: { name: true, currency: true, color: true } },
                category: { select: { name: true, color: true, icon: true } }
            },
            orderBy: { description: 'asc' }
        });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching recurring templates:', error);
        res.status(500).json({ error: 'Error al obtener plantillas recurrentes' });
    }
});

// POST create recurring template
router.post('/recurring-transactions', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { accountId, categoryId, amount, currency, description, frequency, startDate, nextDueDate } = req.body;

        const template = await (prisma as any).recurringTransaction.create({
            data: {
                userId,
                accountId,
                categoryId,
                amount,
                currency: currency || 'NIO',
                description,
                frequency,
                startDate: new Date(startDate),
                nextDueDate: new Date(nextDueDate || startDate),
                isActive: true
            }
        });

        // Procesar inmediatamente para generar instancias iniciales
        await FlowControlService.processRecurringTransactions(userId);

        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating recurring template:', error);
        res.status(500).json({ error: 'Error al crear plantilla recurrente' });
    }
});

// PUT update recurring template
router.put('/recurring-transactions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);
        const updates = req.body;

        const existing = await (prisma as any).recurringTransaction.findFirst({
            where: { id: String(id), userId }
        });

        if (!existing) return res.status(404).json({ error: 'Plantilla no encontrada' });

        const template = await (prisma as any).recurringTransaction.update({
            where: { id: String(id) },
            data: {
                ...updates,
                ...(updates.startDate && { startDate: new Date(updates.startDate) }),
                ...(updates.nextDueDate && { nextDueDate: new Date(updates.nextDueDate) })
            }
        });

        // Reprocesar por si cambió la fecha o frecuencia
        await FlowControlService.processRecurringTransactions(userId);

        res.json(template);
    } catch (error) {
        console.error('Error updating recurring template:', error);
        res.status(500).json({ error: 'Error al actualizar plantilla recurrente' });
    }
});

// DELETE recurring template
router.delete('/recurring-transactions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);

        await FlowControlService.deleteRecurringTransactionTemplate(String(id), userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting recurring template:', error);
        res.status(error.message === 'Plantilla no encontrada' ? 404 : 500).json({ error: error.message || 'Error al eliminar plantilla recurrente' });
    }
});

// ============================================
// RECEIVABLES (Cuentas por cobrar/pagar)
// ============================================

// GET all receivables
router.get('/receivables', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { type, status } = req.query;

        const where: any = { userId };
        if (type) where.type = type;
        if (status) where.status = status;

        const receivables = await prisma.receivable.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(receivables);
    } catch (error) {
        console.error('Error fetching receivables:', error);
        res.status(500).json({ error: 'Error al obtener cuentas' });
    }
});

// POST create receivable
router.post('/receivables', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { personName, amount, type, description, dueDate } = req.body;

        const receivable = await prisma.receivable.create({
            data: {
                userId,
                personName,
                amount,
                type,
                description,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        res.status(201).json(receivable);
    } catch (error) {
        console.error('Error creating receivable:', error);
        res.status(500).json({ error: 'Error al crear cuenta' });
    }
});

// PUT settle receivable (mark as paid)
router.put('/receivables/:id/settle', async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const userId = String(getUserId(req));

        const updated = await FlowControlService.settleReceivable(id, userId, req.body);
        res.json(updated);
    } catch (error: any) {
        console.error('Error settling receivable:', error);
        res.status(error.message === 'No encontrado' ? 404 : 500).json({ error: error.message || 'Error al liquidar cuenta' });
    }
});

// PUT update receivable (edit)
router.put('/receivables/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);
        const { personName, amount, type, description, dueDate } = req.body;

        const existing = await prisma.receivable.findFirst({ where: { id: String(id), userId } });
        if (!existing) return res.status(404).json({ error: 'No encontrado' });

        const updated = await prisma.receivable.update({
            where: { id: String(id) },
            data: {
                personName: personName || existing.personName,
                amount: amount !== undefined ? amount : existing.amount,
                type: type || existing.type,
                description: description !== undefined ? description : existing.description,
                dueDate: dueDate ? new Date(dueDate) : existing.dueDate
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating receivable:', error);
        res.status(500).json({ error: 'Error al actualizar cuenta' });
    }
});

// DELETE receivable
router.delete('/receivables/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);

        const existing = await prisma.receivable.findFirst({ where: { id: String(id), userId } });
        if (!existing) return res.status(404).json({ error: 'No encontrado' });
        await prisma.receivable.delete({
            where: { id: String(id) }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting receivable:', error);
        res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
});

// ============================================
// NOTIFICATIONS
// ============================================

// GET notifications for dashboard
router.get('/notifications', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const notifications = await FlowControlService.getNotifications(userId);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
});

// ============================================
// DASHBOARD SUMMARY
// ============================================

router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const summary = await FlowControlService.getSummary(userId);
        res.json(summary);
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
});


// ============================================
// CHART DATA (for projection graph)
// ============================================

router.get('/chart', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const days = parseInt(req.query.days as string) || 30;
        const chartData = await FlowControlService.getChartData(userId, days);
        res.json(chartData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Error al obtener datos del gráfico' });
    }
});

// ============================================
// TRANSFERS (between accounts)
// ============================================

router.post('/transfers', async (req: Request, res: Response) => {
    try {
        const userId = String(getUserId(req));
        const transfer = await FlowControlService.createTransfer(req.body, userId);
        res.status(201).json(transfer);
    } catch (error: any) {
        console.error('Error creating transfer:', error);
        res.status(error.message === 'No autorizado' ? 403 : 500).json({ error: error.message || 'Error al crear transferencia' });
    }
});

// GET transfers history
router.get('/transfers', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const transfers = await prisma.accountTransfer.findMany({
            where: { userId },
            include: {
                fromAccount: { select: { name: true, currency: true } },
                toAccount: { select: { name: true, currency: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(transfers);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: 'Error al obtener transferencias' });
    }
});

// ============================================
// SETTINGS (exchange rate & display currency)
// ============================================

// GET settings
router.get('/settings', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        let settings = await prisma.flowControlSettings.findUnique({
            where: { userId }
        });

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.flowControlSettings.create({
                data: {
                    userId,
                    exchangeRate: 36.50,
                    displayCurrency: 'NIO'
                }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// PUT update settings
router.put('/settings', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { exchangeRate, displayCurrency } = req.body;

        const settings = await prisma.flowControlSettings.upsert({
            where: { userId },
            update: {
                ...(exchangeRate !== undefined && { exchangeRate }),
                ...(displayCurrency !== undefined && { displayCurrency })
            },
            create: {
                userId,
                exchangeRate: exchangeRate || 36.50,
                displayCurrency: displayCurrency || 'NIO'
            }
        });

        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// POST send statement email
router.post('/send-statement', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const result = await FlowControlService.sendStatement(userId, req.body);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ success: true, message: 'Correo enviado exitosamente' });
    } catch (error: any) {
        console.error('Error in send-statement endpoint:', error);
        res.status(500).json({ error: error.message || 'Error al procesar el envío de correo' });
    }
});

/**
 * GET /api/flowcontrol/ai-advice
 * Obtener consejos financieros personalizados con IA
 */
router.get('/ai-advice', async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const advice = await AIAdvisorService.getFinancialAdvice(userId);
        res.json(advice);
    } catch (error: any) {
        console.error('Error fetching AI advice:', error);
        res.status(500).json({ error: error.message || 'Error al obtener consejos de la IA' });
    }
});

export default router;

