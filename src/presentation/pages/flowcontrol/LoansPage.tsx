import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CreditCard,
    Plus,
    ArrowLeft,
    Calendar,
    ChevronRight,
    PiggyBank,
    Info,
    Banknote,
    Wallet
} from 'lucide-react';
import { config } from '../../../config';
import DualCurrency from '../../components/DualCurrency/DualCurrency';
import { CalculatorInput } from '../../components/flowcontrol/CalculatorInput';

interface Loan {
    id: string;
    name: string;
    bank: string | null;
    principal: number;
    currentBalance: number;
    currency: string;
    interestRate: number;
    monthlyPayment: number;
    remainingMonths: number;
    paymentDay: number;
    status: string;
    nextPaymentDate?: string;
}

export default function LoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [stats, setStats] = useState({ totalDebt: 0, monthlyQuota: 0 });

    // Form state
    const [newLoan, setNewLoan] = useState({
        name: '',
        bank: '',
        principal: '',
        currency: 'NIO',
        interestRate: '',
        termMonths: '',
        remainingMonths: '',
        startDate: new Date().toISOString().split('T')[0],
        paymentDay: '15',
        monthlyPayment: '',
        insurance: '0',
        firstPaymentDate: new Date().toISOString().split('T')[0],
        interestRateType: 'ANNUAL',
        calculationMethod: 'REDUCING_BALANCE',
        precision: '2',
        initialBalance: '' // Opcional para deudas ya iniciadas
    });

    const token = localStorage.getItem('token');

    const fetchData = async () => {
        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/loans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLoans(data);

                // Simple stats
                const total = data.reduce((acc: number, l: any) => acc + Number(l.currentBalance), 0);
                const monthly = data.filter((l: any) => l.status === 'active')
                    .reduce((acc: number, l: any) => acc + Number(l.monthlyPayment), 0);
                setStats({ totalDebt: total, monthlyQuota: monthly });
            }
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newLoan,
                initialBalance: newLoan.initialBalance ? Number(newLoan.initialBalance) : undefined
            };

            const res = await fetch(`${config.API_URL}/flowcontrol/loans`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowForm(false);
                fetchData();
                setNewLoan({
                    name: '', bank: '', principal: '', currency: 'NIO', interestRate: '',
                    termMonths: '', remainingMonths: '', startDate: new Date().toISOString().split('T')[0],
                    firstPaymentDate: new Date().toISOString().split('T')[0],
                    interestRateType: 'ANNUAL',
                    calculationMethod: 'REDUCING_BALANCE',
                    precision: '2',
                    paymentDay: '15', monthlyPayment: '', insurance: '0', initialBalance: ''
                });
            }
        } catch (error) {
            console.error('Error creating loan:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/flowcontrol" className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <PiggyBank className="text-amber-400" /> Préstamos y Deudas
                            </h1>
                            <p className="text-slate-400 text-sm">Gestiona tus financiamientos y cuotas</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={18} /> Nueva Deuda
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet size={64} />
                        </div>
                        <span className="text-slate-500 text-sm uppercase font-semibold tracking-wider">Deuda Total Actual</span>
                        <div className="mt-2">
                            <DualCurrency
                                amount={stats.totalDebt}
                                currency="NIO"
                                displayCurrency="NIO"
                                exchangeRate={36.5}
                                size="lg"
                                className="text-rose-400 font-bold"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Calendar size={64} />
                        </div>
                        <span className="text-slate-500 text-sm uppercase font-semibold tracking-wider">Flujo Mensual (Cuotas)</span>
                        <div className="mt-2">
                            <DualCurrency
                                amount={stats.monthlyQuota}
                                currency="NIO"
                                displayCurrency="NIO"
                                exchangeRate={36.5}
                                size="lg"
                                className="text-amber-400 font-bold"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-dashed border-slate-700 flex items-center justify-center">
                        <div className="text-center group cursor-pointer" onClick={() => setShowForm(true)}>
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-600 transition-colors">
                                <Plus size={24} className="text-slate-400 group-hover:text-white" />
                            </div>
                            <span className="text-sm text-slate-400 group-hover:text-indigo-400 transition-colors">Agregar compromiso social o bancario</span>
                        </div>
                    </div>
                </div>

                {/* Loans List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {loans.map((loan) => (
                            <Link
                                key={loan.id}
                                to={`/flowcontrol/loans/${loan.id}`}
                                className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-slate-600 transition-all group flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{loan.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <Banknote size={14} />
                                                <span>{loan.bank || 'Financiamiento'}</span>
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            {loan.status === 'active' ? 'En Curso' : 'Liquidado'}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Saldo Pendiente</span>
                                            <span className="text-rose-400 font-medium">{((1 - (Number(loan.currentBalance) / Number(loan.principal))) * 100).toFixed(0)}% pagado</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-full transition-all duration-1000"
                                                style={{ width: `${(1 - (Number(loan.currentBalance) / Number(loan.principal))) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Saldo Actual</span>
                                            <span className="text-white font-mono">{loan.currency} {Number(loan.currentBalance).toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Cuota Mensual</span>
                                            <span className="text-amber-400 font-mono font-bold">{loan.currency} {Number(loan.monthlyPayment).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar size={14} className="text-indigo-400" />
                                        <span>Día {loan.paymentDay} • {loan.remainingMonths} cuotas rest.</span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 group-hover:text-white transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {loans.length === 0 && !loading && (
                    <div className="text-center py-20 bg-slate-900 rounded-3xl border border-dashed border-slate-800">
                        <CreditCard size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-slate-400">No tienes deudas registradas</h3>
                        <p className="text-sm text-slate-600 max-w-xs mx-auto mt-2">Registra tus préstamos para incluirlos en el flujo de caja y controlar el abono a capital.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-6 text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                            + Agregar mi primera deuda
                        </button>
                    </div>
                )}

                {/* Modals */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Plus className="text-indigo-500" /> Nueva Deuda / Préstamo
                                </h2>
                                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Column 1 */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Nombre / Concepto</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Ej: Préstamo Carro, Hipoteca..."
                                                value={newLoan.name}
                                                onChange={e => setNewLoan({ ...newLoan, name: e.target.value })}
                                                className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Banco / Institución</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: BAC, Banpro, etc."
                                                value={newLoan.bank}
                                                onChange={e => setNewLoan({ ...newLoan, bank: e.target.value })}
                                                className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Monto Original (Principal)</label>
                                            <CalculatorInput
                                                value={newLoan.principal}
                                                onChange={(val: number) => setNewLoan({ ...newLoan, principal: String(val) })}
                                                placeholder="10,000.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Saldo Actual (Si ya inició)</label>
                                            <CalculatorInput
                                                value={newLoan.initialBalance}
                                                onChange={(val: number) => setNewLoan({ ...newLoan, initialBalance: String(val) })}
                                                placeholder="Dejar vacío si es nuevo"
                                            />
                                        </div>
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Moneda</label>
                                                <select
                                                    value={newLoan.currency}
                                                    onChange={e => setNewLoan({ ...newLoan, currency: e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                                >
                                                    <option value="NIO">NIO</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Día de Pago</label>
                                                <input
                                                    required
                                                    type="number"
                                                    min="1" max="31"
                                                    value={newLoan.paymentDay}
                                                    onChange={e => setNewLoan({ ...newLoan, paymentDay: e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">
                                                    Tasa {newLoan.interestRateType === 'ANNUAL' ? 'Anual' : 'Mensual'} (%)
                                                </label>
                                                <input
                                                    required
                                                    type="number" step="0.01"
                                                    value={newLoan.interestRate}
                                                    onChange={e => setNewLoan({ ...newLoan, interestRate: e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Plazo (Meses)</label>
                                                <input
                                                    required
                                                    type="number"
                                                    value={newLoan.termMonths}
                                                    onChange={e => setNewLoan({ ...newLoan, termMonths: e.target.value, remainingMonths: newLoan.remainingMonths || e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                                    placeholder="Total"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Resta (Meses)</label>
                                                <input
                                                    type="number"
                                                    value={newLoan.remainingMonths}
                                                    onChange={e => setNewLoan({ ...newLoan, remainingMonths: e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                                    placeholder="Si ya inició"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cuota Mensual (Total)</label>
                                            <CalculatorInput
                                                value={newLoan.monthlyPayment}
                                                onChange={(val: number) => setNewLoan({ ...newLoan, monthlyPayment: String(val) })}
                                                placeholder="Incluyendo seguros"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Seguro/Otros (Mensual)</label>
                                            <CalculatorInput
                                                value={newLoan.insurance}
                                                onChange={(val: number) => setNewLoan({ ...newLoan, insurance: String(val) })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Tipo de Tasa</label>
                                                <select
                                                    value={newLoan.interestRateType}
                                                    onChange={e => setNewLoan({ ...newLoan, interestRateType: e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                                                >
                                                    <option value="ANNUAL">Anual</option>
                                                    <option value="MONTHLY">Mensual</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Método</label>
                                                <select
                                                    value={newLoan.calculationMethod}
                                                    onChange={e => setNewLoan({ ...newLoan, calculationMethod: e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                                                >
                                                    <option value="REDUCING_BALANCE">Sobre Saldo</option>
                                                    <option value="FLAT_RATE">Sobre Cuota (Flat)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Precisión Dec.</label>
                                                <select
                                                    value={newLoan.precision}
                                                    onChange={e => setNewLoan({ ...newLoan, precision: e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                                                >
                                                    <option value="2">2 Decimales</option>
                                                    <option value="4">4 Decimales</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Fecha de Primer Pago</label>
                                                <input
                                                    required
                                                    type="date"
                                                    value={newLoan.firstPaymentDate}
                                                    onChange={e => setNewLoan({ ...newLoan, firstPaymentDate: e.target.value })}
                                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-900/50 flex items-start gap-3">
                                    <Info size={20} className="text-amber-500 mt-1 flex-shrink-0" />
                                    <p className="text-xs text-amber-200">
                                        El sistema calculará automáticamente el desglose de intereses y abono a capital basado en el saldo actual y la tasa proporcionada. Si el pago mensual es mayor a la cuota calculada, se aplicará el excedente como abono a capital.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-2xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30"
                                    >
                                        Guardar Deuda
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
