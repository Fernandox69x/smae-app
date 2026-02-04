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
    Banknote,
    Calendar,
    Clock,
    ArrowRight,
    RefreshCw,
    Settings,
    Tag,
    PiggyBank,
    Repeat,
    Calculator,
    ShoppingBag
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Legend } from 'recharts';
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
    const [chartData, setChartData] = useState<{ date: string; balance: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState<'NIO' | 'USD'>('NIO');
    const [exchangeRate, setExchangeRate] = useState(36.50);
    const [showSettings, setShowSettings] = useState(false);
    const [tempRate, setTempRate] = useState('36.50');

    const token = localStorage.getItem('token');

    const fetchData = async () => {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const [summaryRes, notifRes, chartRes] = await Promise.all([
                fetch(`${config.API_URL}/flowcontrol/summary`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/notifications`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/chart?days=30`, { headers })
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
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Wallet className="text-indigo-500" /> FlowControl
                        </h1>
                        <p className="text-slate-400 text-sm">Gestión de Flujo de Efectivo</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Settings */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                            title="Configurar tipo de cambio"
                        >
                            <Settings size={18} className="text-slate-400" />
                        </button>

                        <div className="flex gap-3">
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-right">
                                <span className="text-xs text-slate-500 uppercase block">Saldo Real</span>
                                <DualCurrency
                                    amount={summary?.realBalance || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency={displayCurrency}
                                    size="md"
                                    className={(summary?.realBalance || 0) < 0 ? 'text-red-400' : 'text-emerald-400'}
                                />
                            </div>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-right">
                                <span className="text-xs text-slate-500 uppercase block">Proyección</span>
                                <DualCurrency
                                    amount={summary?.projectedBalance || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency={displayCurrency}
                                    size="md"
                                    className={(summary?.projectedBalance || 0) < 0 ? 'text-red-500' : 'text-indigo-400'}
                                />
                            </div>
                        </div>
                    </div>
                </header>

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

                {/* AI Advisor */}
                <div className="mb-6">
                    <FinancialAdvisor />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Chart */}
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <TrendingUp size={18} /> Proyección 30 Días
                                </h3>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#94a3b8"
                                            tickFormatter={(str) => new Date(str).getDate().toString()}
                                        />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                            formatter={(value: any) => [`C$ ${value?.toLocaleString()}`, 'Saldo']}
                                        />
                                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                                        <Line
                                            type="monotone"
                                            dataKey="balance"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            dot={{ fill: '#6366f1', r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Línea roja = C$ 0. Si la gráfica baja, te quedas sin efectivo.
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                    <TrendingUp size={18} />
                                    <span className="text-xs uppercase">Ingresos</span>
                                </div>
                                <DualCurrency
                                    amount={summary?.incomeThisMonth || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency="NIO"
                                    size="md"
                                    className="text-white"
                                />
                                <span className="text-xs text-slate-500">Este mes</span>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-2 text-rose-400 mb-2">
                                    <TrendingDown size={18} />
                                    <span className="text-xs uppercase">Gastos</span>
                                </div>
                                <DualCurrency
                                    amount={summary?.expenseThisMonth || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency="NIO"
                                    size="md"
                                    className="text-white"
                                />
                                <span className="text-xs text-slate-500">Este mes</span>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-2 text-amber-400 mb-2">
                                    <ArrowRight size={18} />
                                    <span className="text-xs uppercase">Me Deben</span>
                                </div>
                                <DualCurrency
                                    amount={summary?.totalReceivable || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency="NIO"
                                    size="md"
                                    className="text-white"
                                />
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-2 text-red-400 mb-2">
                                    <TrendingDown size={18} />
                                    <span className="text-xs uppercase">Debo</span>
                                </div>
                                <DualCurrency
                                    amount={summary?.totalPayable || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency="NIO"
                                    size="md"
                                    className="text-white"
                                />
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 border-l-4 border-l-amber-500/50">
                                <div className="flex items-center gap-2 text-amber-500 mb-2">
                                    <PiggyBank size={18} />
                                    <span className="text-xs uppercase">Deuda Préstamos</span>
                                </div>
                                <DualCurrency
                                    amount={summary?.totalLoanDebt || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency="NIO"
                                    size="md"
                                    className="text-white"
                                />
                                <span className="text-xs text-slate-500">Total saldo</span>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 border-l-4 border-l-indigo-500/50">
                                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                    <Clock size={18} />
                                    <span className="text-xs uppercase">Cuotas Préstamos</span>
                                </div>
                                <DualCurrency
                                    amount={summary?.monthlyLoanCommitment || 0}
                                    currency="NIO"
                                    exchangeRate={exchangeRate}
                                    displayCurrency="NIO"
                                    size="md"
                                    className="text-white"
                                />
                                <span className="text-xs text-slate-500">Total mensual</span>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                            <h3 className="font-bold text-white mb-4">Acciones Rápidas</h3>
                            <div className="space-y-2">
                                <Link
                                    to="/flowcontrol/dashboard"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Wallet size={18} className="text-indigo-400" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link
                                    to="/flowcontrol/transactions"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Plus size={18} className="text-emerald-400" />
                                    <span>Nueva Transacción</span>
                                </Link>
                                <Link
                                    to="/flowcontrol/shopping"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ShoppingBag size={18} className="text-amber-400" />
                                    <span>Lista de Compras</span>
                                </Link>
                                <Link
                                    to="/flowcontrol/recurring"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border-l-2 border-l-amber-500/50"
                                >
                                    <Repeat size={18} className="text-amber-400" />
                                    <span>Gastos Recurrentes</span>
                                </Link>
                                <Link
                                    to="/flowcontrol/simulator"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Calculator size={18} className="text-blue-400" />
                                    <span>Simulador</span>
                                </Link>
                                <Link
                                    to="/flowcontrol/accounts"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <CreditCard size={18} className="text-indigo-400" />
                                    <span>Cuentas</span>
                                </Link>
                                <Link
                                    to="/flowcontrol/receivables"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <DollarSign size={18} className="text-amber-400" />
                                    <span>Cuentas por Cobrar</span>
                                </Link>
                                <Link
                                    to="/flowcontrol/categories"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Tag size={18} className="text-indigo-400" />
                                    <span>Categorías</span>
                                </Link>
                                <Link
                                    to="/flowcontrol/loans"
                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <PiggyBank size={18} className="text-amber-400" />
                                    <span>Préstamos</span>
                                </Link>
                            </div>
                        </div>

                        {/* Categorización de Gastos */}
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Tag size={18} className="text-indigo-400" /> Distribución de Gastos
                            </h3>
                            <div className="h-64 w-full">
                                {summary?.categoryDistribution && summary.categoryDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={summary.categoryDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {summary.categoryDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                                                formatter={(value: any) => [`C$ ${value.toLocaleString()}`, 'Gastado']}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                                        <Tag size={32} className="mb-2 opacity-20" />
                                        <p>No hay gastos registrados este mes</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Accounts */}
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Wallet size={18} /> Mis Cuentas
                            </h3>
                            <div className="space-y-3">
                                {summary?.accounts?.map(acc => (
                                    <div
                                        key={acc.id}
                                        className="p-3 bg-slate-800 rounded-lg border-l-4"
                                        style={{ borderLeftColor: acc.color }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-white flex items-center gap-2">
                                                    {acc.type === 'credit' ? (
                                                        <CreditCard size={14} />
                                                    ) : acc.type === 'cash' ? (
                                                        <Banknote size={14} />
                                                    ) : (
                                                        <Wallet size={14} />
                                                    )}
                                                    {acc.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {acc.bank && `${acc.bank} • `}{acc.currency}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {acc.type === 'credit' ? (
                                                    <>
                                                        <div className="text-sm text-rose-400">
                                                            Usado: <DualCurrency
                                                                amount={acc.usedCredit}
                                                                currency={acc.currency}
                                                                exchangeRate={exchangeRate}
                                                                displayCurrency="NIO"
                                                                size="sm"
                                                            />
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            Disponible: <DualCurrency
                                                                amount={acc.availableCredit || 0}
                                                                currency={acc.currency}
                                                                exchangeRate={exchangeRate}
                                                                displayCurrency="NIO"
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <DualCurrency
                                                        amount={acc.balance}
                                                        currency={acc.currency}
                                                        exchangeRate={exchangeRate}
                                                        displayCurrency="NIO"
                                                        size="sm"
                                                        className={acc.balance < 0 ? 'text-red-400' : 'text-emerald-400'}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!summary?.accounts || summary.accounts.length === 0) && (
                                    <div className="text-center text-slate-500 py-4">
                                        <Wallet size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No tienes cuentas</p>
                                        <Link
                                            to="/flowcontrol/accounts"
                                            className="text-indigo-400 text-sm hover:underline"
                                        >
                                            Crear primera cuenta
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Forecast Preview */}
                        <div className="bg-slate-900 overflow-hidden rounded-xl border border-slate-800">
                            <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Clock size={18} className="text-indigo-400" /> Próximos Movimientos
                                </h3>
                                <span className="text-[10px] uppercase bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold">Preview</span>
                            </div>
                            <div className="p-5 space-y-6">
                                {/* Next 7 Days */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-300">Siguiente 7 días</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${((summary?.next7DaysIncome || 0) - (summary?.next7DaysExpense || 0)) >= 0
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-rose-500/10 text-rose-400'
                                                }`}>
                                                Neto: C$ {((summary?.next7DaysIncome || 0) - (summary?.next7DaysExpense || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                            <span className="text-[10px] uppercase text-emerald-500 block mb-1">Ingresos</span>
                                            <DualCurrency
                                                amount={summary?.next7DaysIncome || 0}
                                                currency="NIO"
                                                exchangeRate={exchangeRate}
                                                displayCurrency="NIO"
                                                size="sm"
                                                className="text-white font-bold"
                                            />
                                        </div>
                                        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                            <span className="text-[10px] uppercase text-rose-500 block mb-1">Egresos</span>
                                            <DualCurrency
                                                amount={summary?.next7DaysExpense || 0}
                                                currency="NIO"
                                                exchangeRate={exchangeRate}
                                                displayCurrency="NIO"
                                                size="sm"
                                                className="text-white font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Remaining Month */}
                                <div className="pt-4 border-t border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-300">Restante del Mes</span>
                                        <span className="text-[10px] text-slate-500 italic">Corte: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('es-NI', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase text-slate-500 block">Total Ingresos</span>
                                            <DualCurrency
                                                amount={summary?.remainingMonthIncome || 0}
                                                currency="NIO"
                                                exchangeRate={exchangeRate}
                                                displayCurrency="NIO"
                                                size="sm"
                                                className="text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase text-slate-500 block">Total Gastos</span>
                                            <DualCurrency
                                                amount={summary?.remainingMonthExpense || 0}
                                                currency="NIO"
                                                exchangeRate={exchangeRate}
                                                displayCurrency="NIO"
                                                size="sm"
                                                className="text-slate-300"
                                            />
                                        </div>
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
