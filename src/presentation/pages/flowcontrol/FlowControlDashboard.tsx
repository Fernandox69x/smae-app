import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Plus,
    DollarSign,
    CreditCard,
    Calendar,
    Clock,
    ArrowRight,
    RefreshCw,
    Settings,
    Tag,
    PiggyBank,
    Repeat,
    ShoppingBag,
    LogOut,
    Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { config } from '../../../config';
import DualCurrency from '../../components/DualCurrency/DualCurrency';
import FinancialAdvisor from '../../components/flowcontrol/FinancialAdvisor';

interface Account {
    id: string;
    name: string;
    bank: string | null;
    type: string;
    currency: string;
    balance: number;
    convertedBalance: number | null;
    creditLimit: number | null;
    usedCredit: number;
    availableCredit: number | null;
    creditLimitConverted: number | null;
    color: string;
}

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    description: string;
    dueDate: string;
    status: string;
    account: { name: string; type: string; color: string };
    category: { name: string; color: string } | null;
}

interface Summary {
    realBalance: number;
    projectedBalance: number;
    incomeThisMonth: number;
    expenseThisMonth: number;
    totalReceivable: number;
    totalPayable: number;
    totalLoanDebt: number;
    monthlyLoanCommitment: number;
    next7DaysIncome: number;
    next7DaysExpense: number;
    remainingMonthIncome: number;
    remainingMonthExpense: number;
    categoryDistribution: { name: string; value: number; color: string }[];
    displayCurrency: string;
    exchangeRate: number;
    accounts: Account[];
}

interface Notification {
    dueToday: Transaction[];
    overdue: Transaction[];
    lowBalanceAlert: boolean;
    projectedBalance: number;
    currentBalance: number;
}

export default function FlowControlDashboard() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [notifications, setNotifications] = useState<Notification | null>(null);
    const [chartData, setChartData] = useState<{
        date: string;
        balance: number;
        milestones?: { description: string, amount: number, currency: string, type: string }[]
    }[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState<'NIO' | 'USD'>('NIO');
    const [exchangeRate, setExchangeRate] = useState(36.50);
    const [showSettings, setShowSettings] = useState(false);
    const [tempRate, setTempRate] = useState('36.50');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const fetchData = async () => {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const today = new Date();
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const daysRemaining = lastDayOfMonth - today.getDate();

            const [summaryRes, notifRes, chartRes] = await Promise.all([
                fetch(`${config.API_URL}/flowcontrol/summary`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/notifications`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/chart?days=${daysRemaining}`, { headers })
            ]);

            if (summaryRes.ok) {
                const data = await summaryRes.json();
                setSummary(data);
                setDisplayCurrency(data.displayCurrency || 'NIO');
                setExchangeRate(data.exchangeRate || 36.50);
                setTempRate(String(data.exchangeRate || 36.50));
            }
            if (notifRes.ok) setNotifications(await notifRes.json());
            if (chartRes.ok) setChartData(await chartRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const lowestPoint = useMemo(() => {
        if (chartData.length === 0) return 0;
        return Math.min(...chartData.map(d => d.balance));
    }, [chartData]);

    // Save exchange rate settings
    const saveSettings = async () => {
        try {
            const newRate = parseFloat(tempRate);
            if (isNaN(newRate) || newRate <= 0) return;

            const response = await fetch(`${config.API_URL}/flowcontrol/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ exchangeRate: newRate })
            });

            if (response.ok) {
                setExchangeRate(newRate);
                setShowSettings(false);
                fetchData(); // Refetch with new rate
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <RefreshCw className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header - Version 2 (Consolidated) */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <Wallet className="text-indigo-500" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight">devFinance</h1>
                            <p className="text-slate-500 text-xs">Gestión de Efectivo</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Return to Portfolio */}
                        <Link
                            to="/"
                            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                            <Briefcase size={14} />
                            <span>Portafolio</span>
                        </Link>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="p-2 bg-rose-900/10 border border-rose-500/10 rounded-lg hover:bg-rose-900/20 transition-colors flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase tracking-wider"
                        >
                            <LogOut size={14} />
                            <span>Salir</span>
                        </button>

                        <div className="w-px h-6 bg-slate-800 mx-1"></div>

                        {/* Top Balances Block */}
                        <div className="flex gap-2">
                            <div className="bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-800/50 text-right min-w-[100px]">
                                <span className="text-[9px] text-slate-500 uppercase block font-bold">Saldo</span>
                                <DualCurrency
                                    amount={summary?.realBalance || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency={displayCurrency}
                                    size="sm"
                                    className={(summary?.realBalance || 0) < 0 ? 'text-red-400' : 'text-emerald-400 font-bold'}
                                />
                            </div>
                            <div className="bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-800/50 text-right min-w-[100px]">
                                <span className="text-[9px] text-slate-500 uppercase block font-bold">Proyectado</span>
                                <DualCurrency
                                    amount={summary?.projectedBalance || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency={displayCurrency}
                                    size="sm"
                                    className={(summary?.projectedBalance || 0) < 0 ? 'text-red-500' : 'text-indigo-400 font-bold'}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors ml-1"
                        >
                            <Settings size={16} className="text-slate-500" />
                        </button>
                    </div>
                </header>

                {/* Stats Ribbon - Version 2 (Mosaic Horizontal) */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                            <TrendingUp size={16} className="text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] text-slate-500 uppercase block font-bold truncate">Ingresos</span>
                            <span className="text-sm font-bold text-white block truncate">C$ {summary?.incomeThisMonth.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-lg shrink-0">
                            <TrendingDown size={16} className="text-rose-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] text-slate-500 uppercase block font-bold truncate">Gastos</span>
                            <span className="text-sm font-bold text-white block truncate">C$ {summary?.expenseThisMonth.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                            <ArrowRight size={16} className="text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] text-slate-500 uppercase block font-bold truncate">Cobros</span>
                            <span className="text-sm font-bold text-white block truncate">C$ {summary?.totalReceivable.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg shrink-0">
                            <TrendingDown size={16} className="text-red-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] text-slate-500 uppercase block font-bold truncate">Pagos</span>
                            <span className="text-sm font-bold text-white block truncate">C$ {summary?.totalPayable.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                            <Clock size={16} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] text-slate-500 uppercase block font-bold truncate">Préstamos</span>
                            <span className="text-sm font-bold text-white block truncate">C$ {summary?.monthlyLoanCommitment.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                            <PiggyBank size={16} className="text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] text-slate-500 uppercase block font-bold truncate">Deuda Total</span>
                            <span className="text-sm font-bold text-white block truncate">C$ {summary?.totalLoanDebt.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Settings size={18} /> Configuración de Tipo de Cambio
                        </h3>
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">1 USD =</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={tempRate}
                                        onChange={(e) => setTempRate(e.target.value)}
                                        step="0.01"
                                        className="w-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                                    />
                                    <span className="text-slate-400">NIO</span>
                                </div>
                            </div>
                            <button
                                onClick={saveSettings}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                            >
                                Guardar
                            </button>
                            <p className="text-sm text-slate-500">TC actual: <span className="text-white font-mono">{exchangeRate}</span></p>
                        </div>
                    </div>
                )}

                {/* Alert */}
                {(notifications?.lowBalanceAlert || lowestPoint < 0) && (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                        <AlertCircle className="text-red-500" />
                        <div>
                            <h3 className="font-bold text-red-400">¡Alerta de Flujo de Caja!</h3>
                            <p className="text-sm text-red-300">
                                Tu proyección baja hasta <strong>C$ {lowestPoint.toLocaleString()}</strong>.
                                Necesitas ajustar pagos o ingresos.
                            </p>
                        </div>
                    </div>
                )}

                {/* Notifications Bar */}
                {(notifications?.dueToday?.length || notifications?.overdue?.length) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notifications?.overdue?.length ? (
                            <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="text-amber-500" size={18} />
                                    <span className="font-bold text-amber-400">
                                        {notifications.overdue.length} Vencidos
                                    </span>
                                </div>
                                <ul className="text-sm text-amber-300 space-y-1">
                                    {notifications.overdue.slice(0, 3).map(tx => (
                                        <li key={tx.id}>• {tx.description}: C$ {Math.abs(tx.amount)}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {notifications?.dueToday?.length ? (
                            <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="text-blue-500" size={18} />
                                    <span className="font-bold text-blue-400">
                                        {notifications.dueToday.length} Para Hoy
                                    </span>
                                </div>
                                <ul className="text-sm text-blue-300 space-y-1">
                                    {notifications.dueToday.slice(0, 3).map(tx => (
                                        <li key={tx.id}>• {tx.description}: C$ {Math.abs(tx.amount)}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="max-w-7xl mx-auto space-y-10 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Area (Projection) - 8 cols */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                                        <TrendingUp size={18} className="text-indigo-400" />
                                    </div>
                                    <h3 className="font-bold text-white leading-tight">Proyección del Flujo Mensual</h3>
                                </div>
                            </div>
                            <div className="h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                {chartData.filter(d => d.milestones && d.milestones.length > 0).length > 0 ? (
                                    <div className="space-y-2">
                                        {chartData.filter(d => d.milestones && d.milestones.length > 0).map((day, idx) => (
                                            <div key={idx} className="relative pl-6 pb-6 border-l border-slate-800 last:pb-0">
                                                {/* Dot */}
                                                <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>

                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">
                                                                {new Date(day.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold italic">
                                                                {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Saldo Est.</span>
                                                            <span className="text-sm font-black text-indigo-400">C$ {day.balance.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {day.milestones?.map((m, mIdx) => (
                                                            <div key={mIdx} className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/30 hover:border-slate-700 transition-colors group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-1.5 rounded-lg ${m.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                        m.type === 'loan' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                                                                        }`}>
                                                                        {m.type === 'income' ? <TrendingUp size={12} /> :
                                                                            m.type === 'loan' ? <PiggyBank size={12} /> : <TrendingDown size={12} />}
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-[11px] font-bold text-slate-300 break-words line-clamp-2">{m.description}</span>
                                                                        <span className="text-[8px] text-slate-500 uppercase font-black">
                                                                            {m.type === 'income' ? 'Ingreso' : m.type === 'loan' ? 'Préstamo' : 'Gasto'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className={`text-[11px] font-black ${m.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {m.amount >= 0 ? '+' : ''}{m.amount.toLocaleString()} <span className="text-[8px] opacity-60 ml-0.5">{m.currency}</span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                                        <Calendar size={40} className="opacity-10" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No hay movimientos proyectados</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area - 4 cols */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* AI Advisor - Sidebar Placement */}
                        <FinancialAdvisor />

                        {/* Quick Actions */}
                        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Herramientas</h3>
                            <div className="grid grid-cols-4 gap-3">
                                <Link to="/flowcontrol/transactions" className="flex flex-col items-center gap-1 group" title="Nueva Transacción">
                                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all">
                                        <Plus size={20} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Trans.</span>
                                </Link>
                                <Link to="/flowcontrol/shopping" className="flex flex-col items-center gap-1 group" title="Lista de Compras">
                                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-all">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Compras</span>
                                </Link>
                                <Link to="/flowcontrol/recurring" className="flex flex-col items-center gap-1 group" title="Gastos Recurrentes">
                                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                                        <Repeat size={20} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Recur.</span>
                                </Link>
                                <Link to="/flowcontrol/accounts" className="flex flex-col items-center gap-1 group" title="Cuentas">
                                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-all">
                                        <CreditCard size={20} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Cuentas</span>
                                </Link>
                                <Link to="/flowcontrol/receivables" className="flex flex-col items-center gap-1 group" title="Cuentas por Cobrar">
                                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-all">
                                        <DollarSign size={20} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Cobros</span>
                                </Link>
                                <Link to="/flowcontrol/categories" className="flex flex-col items-center gap-1 group" title="Categorías">
                                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                                        <Tag size={20} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Cat.</span>
                                </Link>
                                <Link to="/flowcontrol/loans" className="flex flex-col items-center gap-1 group" title="Préstamos">
                                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-all">
                                        <PiggyBank size={20} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Préstamos</span>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bottom Row - Mosaic (Now full width row) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
                    {/* Accounts Mosaic - 7 cols */}
                    <div className="lg:col-span-7 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                    <Wallet size={16} className="text-indigo-400" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado de Cuentas</h3>
                            </div>
                            <Link to="/flowcontrol/accounts" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">Ver todas</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {summary?.accounts?.filter(acc => acc.balance !== 0).slice(0, 8).map(acc => (
                                <div
                                    key={acc.id}
                                    className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/40 flex flex-col justify-between hover:border-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: acc.color }}></div>
                                        <span className="text-[11px] font-bold text-slate-200 leading-snug group-hover:text-white transition-colors">
                                            {acc.name}
                                        </span>
                                    </div>
                                    <div className="flex items-end justify-between gap-3 mt-auto">
                                        <span className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">
                                            {acc.currency} • {acc.type}
                                        </span>
                                        <div className="text-right">
                                            <DualCurrency
                                                amount={acc.balance}
                                                currency={acc.currency}
                                                exchangeRate={exchangeRate}
                                                displayCurrency={displayCurrency}
                                                size="sm"
                                                className={acc.balance < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Movements List - 5 cols */}
                    <div className="lg:col-span-5 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                <Clock size={16} className="text-amber-400" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próximos Movimientos</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2 p-4 bg-slate-950/40 rounded-xl border border-slate-800/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Vencimientos 7 Días</span>
                                    <div className="text-right">
                                        <DualCurrency
                                            amount={(summary?.next7DaysIncome || 0) - (summary?.next7DaysExpense || 0)}
                                            currency="NIO"
                                            exchangeRate={exchangeRate}
                                            displayCurrency={displayCurrency}
                                            size="sm"
                                            className={((summary?.next7DaysIncome || 0) - (summary?.next7DaysExpense || 0)) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}
                                        />
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
                                    <div className={`h-full rounded-full ${((summary?.next7DaysIncome || 0) - (summary?.next7DaysExpense || 0)) >= 0 ? 'bg-emerald-500/30' : 'bg-rose-500/30'}`} style={{ width: '65%' }}></div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 p-4 bg-slate-950/40 rounded-xl border border-slate-800/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Cierre de Mes</span>
                                        <span className="text-[10px] text-indigo-400 font-bold uppercase">
                                            {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('es-NI', { day: '2-digit', month: 'long' })}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <DualCurrency
                                            amount={(summary?.remainingMonthIncome || 0) - (summary?.remainingMonthExpense || 0)}
                                            currency="NIO"
                                            exchangeRate={exchangeRate}
                                            displayCurrency={displayCurrency}
                                            size="md"
                                            className="text-indigo-400 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
