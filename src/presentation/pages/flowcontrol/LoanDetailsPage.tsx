import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    History,
    Info,
    LayoutGrid,
    Receipt,
    Edit,
    Settings,
    AlertTriangle,
    Save,
    Calculator,
    TrendingUp,
    Clock,
    Download,
    Trash2
} from 'lucide-react';
import { config } from '../../../config';
import { CalculatorInput } from '../../components/flowcontrol/CalculatorInput';
import { ExportService } from '../../../infrastructure/services/ExportService';
import { DateUtils } from '../../../infrastructure/utils/dateUtils';

interface Account {
    id: string;
    name: string;
    currency: string;
}

interface Payment {
    id: string;
    paymentDate: string;
    installmentNum: number | null;
    totalAmount: number;
    principalAmount: number;
    interestAmount: number;
    feesAmount: number;
    isExtraPayment: boolean;
    transaction?: {
        accountId: string;
    };
    expectedPrincipal?: number;
    expectedInterest?: number;
    notes?: string;
}

interface Loan {
    id: string;
    name: string;
    bank: string | null;
    principal: number;
    currentBalance: number;
    currency: string;
    interestRate: number;
    monthlyPayment: number;
    termMonths: number;
    remainingMonths: number;
    insurance: number;
    paymentDay: number;
    firstPaymentDate: string;
    interestRateType: string;
    calculationMethod: string;
    precision: number;
    status: string;
    payments: Payment[];
}

export default function LoanDetailsPage() {
    const { id } = useParams();
    const [loan, setLoan] = useState<Loan | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'history' | 'amortization' | 'simulator'>('history');

    const exportService = useMemo(() => new ExportService(), []);

    // Simulator state
    const [simExtra, setSimExtra] = useState('');
    const [simIsRecurrent, setSimIsRecurrent] = useState(false);

    // Payment form state
    const [paymentForm, setPaymentForm] = useState({
        accountId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        isExtraPayment: false,
        interestAmount: '',
        feesAmount: '',
        installmentNum: '',
        expectedPrincipal: 0,
        expectedInterest: 0,
        notes: ''
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        bank: '',
        principal: '',
        currentBalance: '',
        currency: 'NIO',
        interestRate: '',
        startDate: '',
        termMonths: '',
        remainingMonths: '',
        paymentDay: '',
        monthlyPayment: '',
        insurance: '',
        firstPaymentDate: '',
        interestRateType: 'ANNUAL',
        calculationMethod: 'REDUCING_BALANCE',
        precision: '2',
        status: ''
    });

    const token = localStorage.getItem('token');

    const fetchData = async () => {
        try {
            const [loanRes, accRes] = await Promise.all([
                fetch(`${config.API_URL}/flowcontrol/loans/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${config.API_URL}/flowcontrol/accounts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (loanRes.ok) {
                const loanData = await loanRes.json();
                setLoan(loanData);

                // Pre-fill next payment details
                if (loanData.status === 'active') {
                    const monthlyRate = (Number(loanData.interestRate) / 100) / 12;
                    const interest = Number(loanData.currentBalance) * monthlyRate;
                    const fees = Number(loanData.insurance || 0);
                    const principal = Number(loanData.monthlyPayment) - interest - fees;

                    setPaymentForm(prev => ({
                        ...prev,
                        amount: String(loanData.monthlyPayment),
                        interestAmount: interest.toFixed(2),
                        feesAmount: fees.toFixed(2),
                        installmentNum: String((loanData.payments.filter((p: any) => !p.isExtraPayment).length || 0) + 1),
                        expectedPrincipal: principal,
                        expectedInterest: interest,
                        notes: ''
                    }));

                    setEditForm({
                        name: loanData.name,
                        bank: loanData.bank || '',
                        principal: String(loanData.principal),
                        currentBalance: String(loanData.currentBalance),
                        currency: loanData.currency,
                        interestRate: String(loanData.interestRate),
                        startDate: loanData.startDate ? new Date(loanData.startDate).toISOString().split('T')[0] : '',
                        termMonths: String(loanData.termMonths),
                        remainingMonths: String(loanData.remainingMonths),
                        paymentDay: String(loanData.paymentDay),
                        monthlyPayment: String(loanData.monthlyPayment),
                        insurance: String(loanData.insurance),
                        firstPaymentDate: loanData.firstPaymentDate ? new Date(loanData.firstPaymentDate).toISOString().split('T')[0] : '',
                        interestRateType: loanData.interestRateType || 'ANNUAL',
                        calculationMethod: loanData.calculationMethod || 'REDUCING_BALANCE',
                        precision: String(loanData.precision || 2),
                        status: loanData.status
                    });
                }
            }

            if (accRes.ok) setAccounts(await accRes.json());
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/loans/${id}/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentForm)
            });

            if (res.ok) {
                setShowPaymentModal(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error recording payment:', error);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/loans/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setShowEditModal(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error updating loan:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar este préstamo? Se perderá el historial de pagos asociados, aunque las transacciones monetarias se mantendrán en tu registro.')) return;

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/loans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                window.location.href = '/flowcontrol/loans';
            }
        } catch (error) {
            console.error('Error deleting loan:', error);
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este pago? Se revertirán los saldos asociados.')) return;

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/loans/${id}/payments/${paymentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchData(); // Recargar datos para ver saldos actualizados
            }
        } catch (error) {
            console.error('Error deleting payment:', error);
        }
    };

    const nextPaymentDate = useMemo(() => {
        if (!loan) return null;
        const today = new Date();
        const firstPayment = new Date(loan.firstPaymentDate);

        // Si hoy es antes del primer pago, la próxima es el primer pago
        if (today < firstPayment) return firstPayment;

        // Si hoy es después del primer pago, calcular la próxima basada en el paymentDay
        let candidateDate = new Date(today.getFullYear(), today.getMonth(), loan.paymentDay);

        // Si ya pasó el día en este mes, evaluar el próximo mes inicialmente
        if (candidateDate < today) {
            candidateDate.setMonth(candidateDate.getMonth() + 1);
        }

        // CRITICAL FIX: Verificar si YA EXISTE un pago para ese mes/año candidato
        // Esto evita que salga "20 Feb" si ya pagaste la cuota de Febrero
        const hasPaidCandidateMonth = loan.payments.some(p => {
            if (p.isExtraPayment) return false; // Ignorar abonos extra
            const pDate = new Date(p.paymentDate);
            return pDate.getFullYear() === candidateDate.getFullYear() &&
                pDate.getMonth() === candidateDate.getMonth();
        });

        if (hasPaidCandidateMonth) {
            candidateDate.setMonth(candidateDate.getMonth() + 1);
        }

        return candidateDate;
    }, [loan]);

    const theoreticalSchedule = useMemo(() => {
        if (!loan) return [];

        const precision = loan.precision || 2;
        const round = (val: number) => {
            const p = Math.pow(10, precision);
            return Math.round(val * p) / p;
        };

        const monthlyRate = loan.interestRateType === 'MONTHLY'
            ? (Number(loan.interestRate) / 100)
            : (Number(loan.interestRate) / 100) / 12;

        const schedule = [];
        let balance = Number(loan.currentBalance);
        const insurance = Number(loan.insurance);

        if (loan.calculationMethod === 'FLAT_RATE') {
            const interestPerMonth = round(Number(loan.principal) * monthlyRate);
            const principalPerMonth = round(Number(loan.principal) / (Number(loan.termMonths) || 1));
            const totalPerMonth = interestPerMonth + principalPerMonth + insurance;

            for (let i = 1; i <= loan.remainingMonths; i++) {
                balance -= principalPerMonth;
                schedule.push({
                    num: (loan.payments.filter(p => !p.isExtraPayment).length || 0) + i,
                    total: totalPerMonth,
                    principal: principalPerMonth,
                    interest: interestPerMonth,
                    fees: insurance,
                    balance: Math.max(0, round(balance))
                });
            }
        } else {
            // REDUCING_BALANCE (French System)
            for (let i = 1; i <= loan.remainingMonths; i++) {
                const interest = round(balance * monthlyRate);
                const principal = round(Number(loan.monthlyPayment) - interest - insurance);
                balance -= principal;
                schedule.push({
                    num: (loan.payments.filter(p => !p.isExtraPayment).length || 0) + i,
                    total: loan.monthlyPayment,
                    principal: Math.max(0, principal),
                    interest,
                    fees: insurance,
                    balance: Math.max(0, round(balance))
                });
            }
        }
        return schedule;
    }, [loan]);

    const simulatedResults = useMemo(() => {
        if (!loan) return { schedule: [], stats: { totalInterest: 0, months: 0, interestSaved: 0, monthsSaved: 0 } };

        const precision = loan.precision || 2;
        const round = (val: number) => {
            const p = Math.pow(10, precision);
            return Math.round(val * p) / p;
        };

        const monthlyRate = loan.interestRateType === 'MONTHLY'
            ? (Number(loan.interestRate) / 100)
            : (Number(loan.interestRate) / 100) / 12;

        const extra = Number(simExtra) || 0;
        const schedule = [];
        let balance = Number(loan.currentBalance);
        const insurance = Number(loan.insurance);
        let totalInterest = 0;

        const maxMonths = 360; // Safety cap
        let months = 0;
        const baseNum = (loan.payments.filter((p: any) => !p.isExtraPayment).length || 0);

        while (balance > 0.01 && months < maxMonths) {
            months++;
            const interest = round(balance * monthlyRate);
            totalInterest += interest;

            let principalPart = 0;
            if (loan.calculationMethod === 'FLAT_RATE') {
                principalPart = round(Number(loan.principal) / (Number(loan.termMonths) || 1));
            } else {
                principalPart = round(Number(loan.monthlyPayment) - interest - insurance);
            }

            const currentExtra = (simIsRecurrent || (months === 1)) ? extra : 0;
            const totalAbono = principalPart + currentExtra;

            if (balance < totalAbono) {
                schedule.push({
                    num: baseNum + months,
                    total: balance + interest + insurance,
                    principal: balance,
                    interest,
                    fees: insurance,
                    balance: 0
                });
                balance = 0;
            } else {
                balance -= totalAbono;
                schedule.push({
                    num: baseNum + months,
                    total: Number(loan.monthlyPayment) + (currentExtra > 0 ? currentExtra : 0),
                    principal: round(totalAbono),
                    interest,
                    fees: insurance,
                    balance: Math.max(0, round(balance))
                });
            }
        }

        const theoreticalTotalInterest = theoreticalSchedule.reduce((acc, s) => acc + s.interest, 0);
        const theoreticalMonths = theoreticalSchedule.length;

        return {
            schedule,
            stats: {
                totalInterest: round(totalInterest),
                months,
                interestSaved: Math.max(0, round(theoreticalTotalInterest - totalInterest)),
                monthsSaved: Math.max(0, theoreticalMonths - months)
            }
        };
    }, [loan, simExtra, simIsRecurrent, theoreticalSchedule]);

    const handleExportPDF = () => {
        if (!loan) return;

        const options = {
            fileName: `Estado_Cuenta_${loan.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
            title: `Estado de Cuenta - ${loan.name}`,
            columns: [
                { header: 'Fecha', dataKey: 'date' },
                { header: 'Concepto', dataKey: 'installment' },
                { header: 'Total', dataKey: 'total' },
                { header: 'Principal', dataKey: 'principal' },
                { header: 'Interés', dataKey: 'interest' },
                { header: 'Seguro', dataKey: 'fees' }
            ],
            data: loan.payments.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()).map(p => ({
                date: new Date(p.paymentDate).toLocaleDateString(),
                installment: p.isExtraPayment ? 'Abono Extraordinario' : `Cuota #${p.installmentNum}`,
                total: `${loan.currency} ${p.totalAmount.toLocaleString()}`,
                principal: `${loan.currency} ${p.principalAmount.toLocaleString()}`,
                interest: `${loan.currency} ${p.interestAmount.toLocaleString()}`,
                fees: `${loan.currency} ${p.feesAmount.toLocaleString()}`
            }))
        };

        exportService.exportToPDF(options);
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;
    if (!loan) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Préstamo no encontrado</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/flowcontrol/loans" className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{loan.name}</h1>
                            <p className="text-slate-400 text-sm">{loan.bank || 'Financiamiento Personal'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportPDF}
                            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all"
                            title="Descargar Estado de Cuenta PDF"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all"
                            title="Editar Préstamo"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-800 transition-all"
                            title="Eliminar Préstamo"
                        >
                            <Trash2 size={20} />
                        </button>
                        {loan.status === 'active' && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <DollarSign size={18} /> Registrar Pago
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-xl">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="col-span-2">
                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-2">Saldo Pendiente</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-white">{loan.currency} {Number(loan.currentBalance).toLocaleString()}</span>
                                        <span className="text-rose-500 text-sm font-bold">-{((Number(loan.currentBalance) / Number(loan.principal)) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-2">Tasa Interés</span>
                                    <span className="text-xl font-bold text-indigo-400">{loan.interestRate}% <span className="text-xs font-normal text-slate-600">anual</span></span>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-2">Cuota Nivelada</span>
                                    <span className="text-xl font-bold text-amber-400">{loan.currency} {Number(loan.monthlyPayment).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Monto Inicial</span>
                                    <span className="text-sm font-medium text-slate-300">{loan.currency} {Number(loan.principal).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Pagos Restantes</span>
                                    <span className="text-sm font-medium text-slate-300">{loan.remainingMonths} meses</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Día de Pago</span>
                                    <span className="text-sm font-medium text-slate-300">{loan.paymentDay} de cada mes</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Seguro Mensual</span>
                                    <span className="text-sm font-medium text-slate-300">{loan.currency} {Number(loan.insurance).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                            <div className="flex border-b border-slate-800">
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <History size={16} /> Historial
                                </button>
                                <button
                                    onClick={() => setActiveTab('amortization')}
                                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'amortization' ? 'bg-slate-800 text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <LayoutGrid size={16} /> Amortización
                                </button>
                                <button
                                    onClick={() => setActiveTab('simulator')}
                                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'simulator' ? 'bg-slate-800 text-white border-b-2 text-blue-400 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Calculator size={16} /> Simulador
                                </button>
                            </div>

                            <div className="p-2 overflow-x-auto">
                                {activeTab === 'history' && (
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="text-[10px] text-slate-500 uppercase font-black border-b border-slate-800">
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3">Concepto</th>
                                                <th className="px-4 py-3 text-right">Abono Capital</th>
                                                <th className="px-4 py-3 text-right">Interés/Otros</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {loan.payments.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-4 text-sm font-mono text-slate-400">
                                                        {new Date(p.paymentDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white">
                                                                {p.isExtraPayment ? 'Adelanto Capital' : `Cuota #${p.installmentNum}`}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">Saldo tras pago: {loan.currency} {Number(loan.principal - loan.payments.filter(px => new Date(px.paymentDate) <= new Date(p.paymentDate)).reduce((acc, px) => acc + Number(px.principalAmount), 0)).toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-sm font-bold text-emerald-400">
                                                        {loan.currency} {Number(p.principalAmount).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-sm text-slate-400">
                                                        {loan.currency} {(Number(p.interestAmount) + Number(p.feesAmount)).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-sm font-black text-white">{loan.currency} {Number(p.totalAmount).toLocaleString()}</span>
                                                            {p.notes && (
                                                                <span className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1" title={p.notes}>
                                                                    <Info size={10} /> Ver nota
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeletePayment(p.id)}
                                                            className="p-1 hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 rounded transition-colors"
                                                            title="Eliminar pago"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {loan.payments.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500 italic">No se han registrado pagos todavía</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'amortization' && (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] text-slate-500 uppercase font-black border-b border-slate-800">
                                                <th className="px-4 py-3">#</th>
                                                <th className="px-4 py-3">Cuota</th>
                                                <th className="px-4 py-3 text-right">Capital</th>
                                                <th className="px-4 py-3 text-right">Interés</th>
                                                <th className="px-4 py-3 text-right">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {theoreticalSchedule.map((s: any) => (
                                                <tr key={s.num} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-3 text-xs text-slate-600 font-bold">{s.num}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-300">{loan.currency} {Number(s.total).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-xs text-emerald-500/80">{loan.currency} {s.principal.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-xs text-rose-500/80">{loan.currency} {s.interest.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono text-slate-400">{loan.currency} {s.balance.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'simulator' && (
                                    <div className="p-6 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                            <div className="space-y-6">
                                                <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800/50">
                                                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                        <Calculator size={18} className="text-blue-400" /> Parámetros de Simulación
                                                    </h4>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">¿Cuánto más puedes pagar?</label>
                                                            <CalculatorInput
                                                                value={simExtra}
                                                                onChange={(val: number) => setSimExtra(String(val))}
                                                                placeholder="Monto adicional..."
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-300">Abono Recurrente</span>
                                                                <span className="text-[10px] text-slate-500">Se aplica a todas las cuotas</span>
                                                            </div>
                                                            <button
                                                                onClick={() => setSimIsRecurrent(!simIsRecurrent)}
                                                                className={`w-12 h-6 rounded-full transition-all relative ${simIsRecurrent ? 'bg-blue-600' : 'bg-slate-700'}`}
                                                            >
                                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${simIsRecurrent ? 'left-7' : 'left-1'}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-3xl">
                                                    <div className="flex gap-3">
                                                        <Info size={20} className="text-blue-400 shrink-0" />
                                                        <p className="text-xs text-slate-400 leading-relaxed italic">
                                                            Esta simulación calcula el impacto de tus abonos extra directamente al capital.
                                                            Los resultados son proyectados y pueden variar ligeramente según la fecha exacta de tus pagos reales.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest block mb-1">Ahorro en Intereses</span>
                                                        <span className="text-2xl font-black text-emerald-500">{loan.currency} {simulatedResults.stats.interestSaved.toLocaleString()}</span>
                                                    </div>
                                                    <TrendingUp className="text-emerald-500/30" size={40} />
                                                </div>
                                                <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest block mb-1">Tiempo Ahorrado</span>
                                                        <span className="text-2xl font-black text-indigo-500">{simulatedResults.stats.monthsSaved} Meses</span>
                                                    </div>
                                                    <Clock className="text-indigo-500/30" size={40} />
                                                </div>
                                                <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-3xl">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Nuevo Plazo</span>
                                                            <span className="text-lg font-bold text-white">{simulatedResults.stats.months} meses</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Interés Total</span>
                                                            <span className="text-lg font-bold text-white">{loan.currency} {simulatedResults.stats.totalInterest.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {simExtra && Number(simExtra) > 0 && (
                                            <div className="pt-4 animate-in fade-in slide-in-from-bottom-2">
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Nueva Proyección de Amortización</h4>
                                                <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="text-[10px] text-slate-500 uppercase font-black border-b border-slate-800">
                                                                <th className="px-4 py-3">#</th>
                                                                <th className="px-4 py-3">Cuota + Extra</th>
                                                                <th className="px-4 py-3 text-right">Capital</th>
                                                                <th className="px-4 py-3 text-right">Interés</th>
                                                                <th className="px-4 py-3 text-right">Saldo</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-800/50">
                                                            {simulatedResults.schedule.slice(0, 5).map((s: any) => (
                                                                <tr key={s.num} className="hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-4 py-3 text-xs text-slate-600 font-bold">{s.num}</td>
                                                                    <td className="px-4 py-3 text-xs font-bold text-white">{loan.currency} {Number(s.total).toLocaleString()}</td>
                                                                    <td className="px-4 py-3 text-right text-xs text-emerald-500/80">{loan.currency} {s.principal.toLocaleString()}</td>
                                                                    <td className="px-4 py-3 text-right text-xs text-rose-500/80">{loan.currency} {s.interest.toLocaleString()}</td>
                                                                    <td className="px-4 py-3 text-right text-xs font-mono text-slate-400">{loan.currency} {s.balance.toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                            {simulatedResults.schedule.length > 5 && (
                                                                <tr>
                                                                    <td colSpan={5} className="px-4 py-3 text-center text-[10px] text-slate-600 italic">
                                                                        ... mostrando las primeras 5 de {simulatedResults.schedule.length} cuotas proyectadas ...
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            <tr className="bg-blue-500/5">
                                                                <td colSpan={4} className="px-4 py-3 text-xs font-bold text-blue-400">Pago Final en Cuota:</td>
                                                                <td className="px-4 py-3 text-right text-xs font-black text-blue-400">{simulatedResults.schedule[simulatedResults.schedule.length - 1].num}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Info size={16} className="text-indigo-400" /> Resumen de Intereses
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Intereses Pagados</span>
                                    <span className="text-rose-400 font-bold">{loan.currency} {loan.payments.reduce((acc, p) => acc + Number(p.interestAmount), 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Capital Amortizado</span>
                                    <span className="text-emerald-400 font-bold">{loan.currency} {loan.payments.reduce((acc, p) => acc + Number(p.principalAmount), 0).toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500 uppercase font-black">Ahorro proyectado</span>
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Adelantos</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                        Cada adelanto que realices reduce el saldo principal directamente, lo que disminuye los intereses generados en las siguientes cuotas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl">
                            <h3 className="text-sm font-bold text-white mb-4">Próxima Cuota</h3>
                            {loan.status === 'active' ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-800">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                                <Calendar className="text-indigo-400" size={20} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-500 uppercase font-black block">Vencimiento</span>
                                                <span className="text-sm font-bold text-white">
                                                    {nextPaymentDate ? nextPaymentDate.toLocaleDateString('es-NI', { day: 'numeric', month: 'long' }) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] text-slate-500 uppercase font-black block">Monto a Pagar</span>
                                                <span className="text-xl font-black text-white">{loan.currency} {Number(loan.monthlyPayment).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl transition-all"
                                    >
                                        Pagar Ahora
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-400">
                                        <Receipt size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-400">Deuda Liquidada</p>
                                    <p className="text-xs text-slate-500 mt-1">¡Felicidades! Has completado este compromiso financiero.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Loan Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Edit className="text-indigo-400" /> Editar Préstamo
                            </h2>

                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Nombre del Préstamo</label>
                                        <input
                                            required
                                            type="text"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Banco / Institución</label>
                                        <input
                                            type="text"
                                            value={editForm.bank}
                                            onChange={e => setEditForm({ ...editForm, bank: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Monto Original</label>
                                        <CalculatorInput
                                            value={editForm.principal}
                                            onChange={(val: number) => setEditForm({ ...editForm, principal: String(val) })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Saldo Actual</label>
                                        <CalculatorInput
                                            value={editForm.currentBalance}
                                            onChange={(val: number) => setEditForm({ ...editForm, currentBalance: String(val) })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Moneda</label>
                                        <select
                                            value={editForm.currency}
                                            onChange={e => setEditForm({ ...editForm, currency: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none"
                                        >
                                            <option value="NIO">NIO</option>
                                            <option value="USD">USD</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Fecha de Inicio</label>
                                        <input
                                            type="date"
                                            value={editForm.startDate}
                                            onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">
                                            Tasa de Interés {editForm.interestRateType === 'ANNUAL' ? 'Anual' : 'Mensual'} (%)
                                        </label>
                                        <CalculatorInput
                                            value={editForm.interestRate}
                                            onChange={(val: number) => setEditForm({ ...editForm, interestRate: String(val) })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Plazo (Meses)</label>
                                        <input
                                            type="number"
                                            value={editForm.termMonths}
                                            onChange={e => setEditForm({ ...editForm, termMonths: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cuota Mensual</label>
                                        <CalculatorInput
                                            value={editForm.monthlyPayment}
                                            onChange={(val: number) => setEditForm({ ...editForm, monthlyPayment: String(val) })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Seguro Mensual</label>
                                        <CalculatorInput
                                            value={editForm.insurance}
                                            onChange={(val: number) => setEditForm({ ...editForm, insurance: String(val) })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Meses Restantes</label>
                                        <input
                                            type="number"
                                            value={editForm.remainingMonths}
                                            onChange={e => setEditForm({ ...editForm, remainingMonths: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Día de Pago</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={editForm.paymentDay}
                                            onChange={e => setEditForm({ ...editForm, paymentDay: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Tipo de Tasa</label>
                                        <select
                                            value={editForm.interestRateType}
                                            onChange={e => setEditForm({ ...editForm, interestRateType: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            <option value="ANNUAL">Anual</option>
                                            <option value="MONTHLY">Mensual</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Método de Cálculo</label>
                                        <select
                                            value={editForm.calculationMethod}
                                            onChange={e => setEditForm({ ...editForm, calculationMethod: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            <option value="REDUCING_BALANCE">Sobre Saldo (Francés)</option>
                                            <option value="FLAT_RATE">Sobre Cuota (Flat)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Precisión Decimal</label>
                                        <select
                                            value={editForm.precision}
                                            onChange={e => setEditForm({ ...editForm, precision: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            <option value="2">2 Decimales</option>
                                            <option value="4">4 Decimales</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Fecha de Primer Pago</label>
                                        <input
                                            type="date"
                                            value={editForm.firstPaymentDate}
                                            onChange={e => setEditForm({ ...editForm, firstPaymentDate: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Estado</label>
                                        <select
                                            value={editForm.status}
                                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none"
                                        >
                                            <option value="active">Activo</option>
                                            <option value="paid">Pagado</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-4 rounded-2xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} /> Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Receipt className="text-emerald-500" /> Registrar Pago
                            </h2>

                            <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cuenta de Origen</label>
                                    <select
                                        required
                                        value={paymentForm.accountId}
                                        onChange={e => setPaymentForm({ ...paymentForm, accountId: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    >
                                        <option value="">Seleccionar cuenta...</option>
                                        {accounts.filter(a => a.currency === loan.currency).map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Fecha de Pago</label>
                                        <input
                                            required
                                            type="date"
                                            value={paymentForm.paymentDate}
                                            onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Concepto del Pago</label>
                                        <div className="flex gap-2 h-[48px]">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentForm({ ...paymentForm, isExtraPayment: false })}
                                                className={`flex-1 rounded-xl text-xs font-bold transition-all ${!paymentForm.isExtraPayment ? 'bg-slate-700 text-white shadow-inner' : 'bg-slate-800 text-slate-500'}`}
                                            >
                                                Cuota
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentForm({ ...paymentForm, isExtraPayment: true })}
                                                className={`flex-1 rounded-xl text-xs font-bold transition-all ${paymentForm.isExtraPayment ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}
                                            >
                                                Adelanto
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Monto Total Cobrado por el Banco</label>
                                        <CalculatorInput
                                            value={paymentForm.amount}
                                            onChange={(val: number) => setPaymentForm({ ...paymentForm, amount: String(val) })}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {!paymentForm.isExtraPayment && (
                                        <div className="col-span-2 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                                                <div className="col-span-2 flex items-center justify-between mb-2">
                                                    <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Desglose de la Cuota</span>
                                                    <div className="text-[10px] text-slate-500 italic">Compara con lo teórico</div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Interés Real</label>
                                                        <span className="text-[10px] text-slate-600 font-medium">Teórico: {loan.currency} {paymentForm.expectedInterest.toFixed(2)}</span>
                                                    </div>
                                                    <CalculatorInput
                                                        value={paymentForm.interestAmount}
                                                        onChange={(val: number) => setPaymentForm({ ...paymentForm, interestAmount: String(val) })}
                                                        placeholder="0.00"
                                                    />
                                                    {Math.abs(Number(paymentForm.interestAmount) - paymentForm.expectedInterest) > 5 && (
                                                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1">
                                                            <AlertTriangle size={10} /> Variación detectada: {loan.currency} {(Number(paymentForm.interestAmount) - paymentForm.expectedInterest).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block">Seguros / Extras</label>
                                                    <CalculatorInput
                                                        value={paymentForm.feesAmount}
                                                        onChange={(val: number) => setPaymentForm({ ...paymentForm, feesAmount: String(val) })}
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div className="col-span-2 pt-2 border-t border-slate-700/50 mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[11px] text-emerald-400 font-bold">Abono Real a Capital:</span>
                                                        <span className="text-sm font-black text-emerald-400">
                                                            {loan.currency} {(Number(paymentForm.amount) - Number(paymentForm.interestAmount) - Number(paymentForm.feesAmount)).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                                        <span>Capital esperado: {loan.currency} {paymentForm.expectedPrincipal.toFixed(2)}</span>
                                                        <span className={Number(paymentForm.amount) - Number(paymentForm.interestAmount) - Number(paymentForm.feesAmount) < paymentForm.expectedPrincipal ? 'text-rose-500' : 'text-emerald-500'}>
                                                            Dif: {((Number(paymentForm.amount) - Number(paymentForm.interestAmount) - Number(paymentForm.feesAmount)) - paymentForm.expectedPrincipal).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Notas o Motivo de Variación</label>
                                                <textarea
                                                    value={paymentForm.notes}
                                                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                                    placeholder="Ej: Ajuste por días de gracia o cargo extra..."
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white text-sm outline-none h-20 resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {paymentForm.isExtraPayment && (
                                        <div className="col-span-2">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-4">
                                                <div className="flex items-center gap-3 text-emerald-400">
                                                    <Info size={18} />
                                                    <p className="text-xs leading-relaxed font-medium">
                                                        Los adelantos a capital se aplican íntegros a reducir la deuda principal, ahorrando intereses en tus futuras cuotas.
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Notas</label>
                                            <textarea
                                                value={paymentForm.notes}
                                                onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                                placeholder="Ej: Bono de fin de año aplicado a capital"
                                                className="w-full bg-slate-800 border-0 rounded-xl p-3 text-white text-sm outline-none h-20 resize-none"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4 col-span-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowPaymentModal(false)}
                                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-4 rounded-2xl transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/30"
                                        >
                                            Confirmar Pago
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
