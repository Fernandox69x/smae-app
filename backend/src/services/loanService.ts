import { PrismaClient } from '@prisma/client';
import { FlowControlService } from './flowcontrolService';
import { sendLoanPaymentConfirmation } from './flowcontrolEmailService';

const prisma = new PrismaClient();

export class LoanService {
    /**
     * Crea un nuevo préstamo e inicializa su estado
     */
    static async createLoan(data: any, userId: string) {
        const {
            name,
            bank,
            principal,
            currency,
            interestRate,
            termMonths,
            remainingMonths,
            startDate,
            paymentDay,
            monthlyPayment,
            insurance,
            firstPaymentDate,
            interestRateType,
            calculationMethod,
            precision,
            initialBalance // Para deudas avanzadas
        } = data;

        const loan = await (prisma as any).loan.create({
            data: {
                userId,
                name,
                bank,
                principal: Number(principal),
                currentBalance: initialBalance !== undefined ? Number(initialBalance) : Number(principal),
                currency: currency || 'NIO',
                interestRate: Number(interestRate),
                termMonths: Number(termMonths),
                remainingMonths: remainingMonths ? Number(remainingMonths) : (initialBalance !== undefined
                    ? Math.round(Number(initialBalance) / (Number(monthlyPayment) - (Number(initialBalance) * (Number(interestRate) / 100 / 12)))) // Estimado simple
                    : Number(termMonths)),
                startDate: new Date(startDate),
                paymentDay: Number(paymentDay),
                monthlyPayment: Number(monthlyPayment),
                insurance: Number(insurance || 0),
                firstPaymentDate: firstPaymentDate ? new Date(firstPaymentDate) : new Date(),
                interestRateType: interestRateType || 'ANNUAL',
                calculationMethod: calculationMethod || 'REDUCING_BALANCE',
                precision: Number(precision || 2),
                status: 'active'
            }
        });

        return loan;
    }

    /**
     * Actualiza los parámetros de un préstamo
     */
    static async updateLoan(loanId: string, userId: string, data: any) {
        const {
            name,
            bank,
            principal,
            currentBalance,
            currency,
            interestRate,
            termMonths,
            remainingMonths,
            startDate,
            paymentDay,
            monthlyPayment,
            insurance,
            firstPaymentDate,
            interestRateType,
            calculationMethod,
            precision,
            status
        } = data;

        const loan = await (prisma as any).loan.findFirst({ where: { id: loanId, userId } });
        if (!loan) throw new Error('Préstamo no encontrado');

        const updated = await (prisma as any).loan.update({
            where: { id: loanId },
            data: {
                name: name !== undefined ? name : undefined,
                bank: bank !== undefined ? bank : undefined,
                principal: principal !== undefined ? Number(principal) : undefined,
                currentBalance: currentBalance !== undefined ? Number(currentBalance) : undefined,
                currency: currency !== undefined ? currency : undefined,
                interestRate: interestRate !== undefined ? Number(interestRate) : undefined,
                termMonths: termMonths !== undefined ? Number(termMonths) : undefined,
                remainingMonths: remainingMonths !== undefined ? Number(remainingMonths) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                paymentDay: paymentDay !== undefined ? Number(paymentDay) : undefined,
                monthlyPayment: monthlyPayment !== undefined ? Number(monthlyPayment) : undefined,
                insurance: insurance !== undefined ? Number(insurance) : undefined,
                firstPaymentDate: firstPaymentDate ? new Date(firstPaymentDate) : undefined,
                interestRateType: interestRateType !== undefined ? interestRateType : undefined,
                calculationMethod: calculationMethod !== undefined ? calculationMethod : undefined,
                precision: precision !== undefined ? Number(precision) : undefined,
                status: status !== undefined ? status : undefined
            }
        });

        return updated;
    }

    /**
     * Obtiene todos los préstamos del usuario
     */
    static async getLoans(userId: string) {
        return (prisma as any).loan.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { payments: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Obtiene detalles de un préstamo y su historial de pagos
     */
    static async getLoanById(id: string, userId: string) {
        const loan = await (prisma as any).loan.findFirst({
            where: { id, userId },
            include: {
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    include: { transaction: true }
                }
            }
        });

        if (!loan) throw new Error('Préstamo no encontrado');
        return loan;
    }

    /**
     * Registra un pago (cuota normal o adelanto)
     */
    static async recordPayment(loanId: string, userId: string, data: any) {
        const {
            accountId,
            paymentDate,
            amount,
            isExtraPayment,
            interestAmount,
            feesAmount,
            installmentNum,
            expectedPrincipal,
            expectedInterest,
            notes
        } = data;

        const loan = await (prisma as any).loan.findFirst({ where: { id: loanId, userId } });
        if (!loan) throw new Error('Préstamo no encontrado');

        const totalAmount = Number(amount);
        let principalPaid: number;
        let interestPaid = Number(interestAmount || 0);
        let feesPaid = Number(feesAmount || 0);

        if (isExtraPayment) {
            // Adelanto a capital: todo va a capital, 0 interés, 0 comisiones (usualmente)
            principalPaid = totalAmount;
            interestPaid = 0;
            feesPaid = 0;
        } else {
            // Pago de cuota normal: capital = total - (interés + comisiones)
            principalPaid = totalAmount - (interestPaid + feesPaid);
        }

        // 1. Crear la transacción financiera
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                accountId,
                amount: -totalAmount, // Siempre es un egreso
                currency: loan.currency,
                description: `${isExtraPayment ? 'Adelanto capital' : 'Pago cuota ' + (installmentNum || '')} - ${loan.name}`,
                dueDate: new Date(paymentDate),
                status: 'applied',
                appliedAt: new Date()
            }
        });

        // 2. Crear el registro de pago del préstamo con seguimiento de variaciones
        const loanPayment = await (prisma as any).loanPayment.create({
            data: {
                loanId,
                transactionId: transaction.id,
                paymentDate: new Date(paymentDate),
                installmentNum: installmentNum ? Number(installmentNum) : null,
                totalAmount: totalAmount,
                principalAmount: principalPaid,
                interestAmount: interestPaid,
                feesAmount: feesPaid,
                expectedPrincipal: expectedPrincipal ? Number(expectedPrincipal) : null,
                expectedInterest: expectedInterest ? Number(expectedInterest) : null,
                isExtraPayment: !!isExtraPayment,
                notes: notes || null
            }
        });

        // 3. Actualizar saldo del préstamo y meses restantes
        const newBalance = Number(loan.currentBalance) - principalPaid;
        const newStatus = newBalance <= 0.01 ? 'paid' : 'active';

        await (prisma as any).loan.update({
            where: { id: loanId },
            data: {
                currentBalance: newBalance,
                status: newStatus,
                remainingMonths: isExtraPayment
                    ? loan.remainingMonths // Los adelantos usualmente no bajan el plazo automáticamente a menos que se recalcule
                    : Math.max(0, loan.remainingMonths - 1)
            }
        });

        // 4. Actualizar saldo de la cuenta bancaria
        await FlowControlService.updateAccountBalance(accountId, -totalAmount, true);

        // 5. Enviar notificación por email (opcional/async)
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            sendLoanPaymentConfirmation(user.email, {
                loanName: loan.name,
                paymentDate: new Date(paymentDate).toLocaleDateString(),
                amount: totalAmount,
                currency: loan.currency,
                principalPaid,
                interestPaid,
                feesPaid,
                newBalance,
                isExtraPayment: !!isExtraPayment,
                userName: user.name || 'Usuario'
            }).catch(err => console.error('Error sending loan email:', err));
        }

        return { loanPayment, transaction };
    }

    /**
     * Genera una tabla de amortización teórica
     */
    static calculateAmortization(principal: number, annualRate: number, months: number, insurance: number = 0, options: any = {}) {
        const {
            interestRateType = 'ANNUAL',
            calculationMethod = 'REDUCING_BALANCE',
            precision = 2
        } = options;

        const round = (val: number) => {
            const p = Math.pow(10, precision);
            return Math.round(val * p) / p;
        };

        const monthlyRate = interestRateType === 'MONTHLY'
            ? (annualRate / 100)
            : (annualRate / 100) / 12;

        const schedule = [];
        let balance = principal;

        if (calculationMethod === 'FLAT_RATE') {
            const interestPerMonth = round(principal * monthlyRate);
            const principalPerMonth = round(principal / months);
            const totalPerMonth = interestPerMonth + principalPerMonth + insurance;

            for (let i = 1; i <= months; i++) {
                balance -= principalPerMonth;
                schedule.push({
                    month: i,
                    total: totalPerMonth,
                    principal: principalPerMonth,
                    interest: interestPerMonth,
                    fees: insurance,
                    balance: Math.max(0, round(balance))
                });
            }
        } else {
            // REDUCING_BALANCE (French System)
            const installment = monthlyRate > 0
                ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
                : principal / months;

            for (let i = 1; i <= months; i++) {
                const interest = round(balance * monthlyRate);
                const principalPart = round((installment + insurance) - (interest + insurance)); // Simplified to use standard installment
                // Actually French system uses fixed total payment (excluding insurance usually, or including if specified)
                // Let's stick to the user's provided monthlyPayment if possible, but here we generate theoretical
                const generatedPrincipal = round(installment - interest);
                balance -= generatedPrincipal;

                schedule.push({
                    month: i,
                    total: round(installment + insurance),
                    principal: generatedPrincipal,
                    interest: interest,
                    fees: insurance,
                    balance: Math.max(0, round(balance))
                });
            }
        }

        return schedule;
    }

    /**
     * Calcula los intereses proyectados para el próximo pago basado en saldo actual
     */
    static calculateNextInstallmentDetails(loan: any) {
        const options = {
            interestRateType: loan.interestRateType || 'ANNUAL',
            calculationMethod: loan.calculationMethod || 'REDUCING_BALANCE',
            precision: loan.precision || 2
        };

        const round = (val: number) => {
            const p = Math.pow(10, options.precision);
            return Math.round(val * p) / p;
        };

        const monthlyRate = options.interestRateType === 'MONTHLY'
            ? (Number(loan.interestRate) / 100)
            : (Number(loan.interestRate) / 100) / 12;

        let interest: number;
        let principal: number;
        const fees = Number(loan.insurance || 0);

        if (options.calculationMethod === 'FLAT_RATE') {
            interest = round(Number(loan.principal) * monthlyRate);
            principal = round(Number(loan.principal) / Number(loan.termMonths));
        } else {
            interest = round(Number(loan.currentBalance) * monthlyRate);
            principal = round(Number(loan.monthlyPayment) - interest - fees);
        }

        return {
            total: Number(loan.monthlyPayment),
            principal: Math.max(0, principal),
            interest: interest,
            fees: fees
        };
    }
}
