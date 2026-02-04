import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    Check,
    Clock,
    TrendingUp,
    TrendingDown,
    Search,
    Calendar,
    X,
    RefreshCw,
    Download,
    FileText
} from 'lucide-react';
import { config } from '../../../config';
import DualCurrency, { useCurrencySettings } from '../../components/DualCurrency/DualCurrency';
import { CalculatorInput } from '../../components/flowcontrol/CalculatorInput';
import { ExportService } from '../../../infrastructure/services/ExportService';
import { DateUtils } from '../../../infrastructure/utils/dateUtils';

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    exchangeRate: number | null;
    description: string;
    dueDate: string;
    status: string;
    account: { name: string; type: string; color: string };
    category: { name: string; color: string; icon: string } | null;
    accountId?: string;
    categoryId?: string;
    recurringTransactionId?: string;
}

interface Account {
    id: string;
    name: string;
    currency: string;
    color: string;
    type: string;
    balance: number;
    creditLimit?: number | null;
    usedCredit?: number;
}

interface Category {
    id: string;
    name: string;
    type: string;
    color: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'applied'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [accountFilter, setAccountFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Apply Modal State
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [txToApply, setTxToApply] = useState<Transaction | null>(null);
    const [applyAccountId, setApplyAccountId] = useState('');
    const [isApplying, setIsApplying] = useState(false);

    const exportService = useMemo(() => new ExportService(), []);

    // Currency settings
    const { exchangeRate, displayCurrency } = useCurrencySettings();

    const [newTx, setNewTx] = useState({
        accountId: '',
        categoryId: '',
        amount: 0,
        currency: 'NIO',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        isIncome: false,
        exchangeRate: null as number | null
    });

    const token = localStorage.getItem('token');

    // Calculate balance warning
    const balanceWarning = useMemo(() => {
        if (!newTx.accountId || newTx.isIncome || newTx.amount <= 0) return null;

        const selectedAccount = accounts.find(a => a.id === newTx.accountId);
        if (!selectedAccount) return null;

        // For credit accounts, check available credit
        if (selectedAccount.type === 'credit') {
            const available = (selectedAccount.creditLimit || 0) - (selectedAccount.usedCredit || 0);
            if (newTx.amount > available) {
                return {
                    type: 'exceed_credit',
                    message: `Excede el crédito disponible (${selectedAccount.currency === 'USD' ? '$' : 'C$'} ${available.toLocaleString()})`,
                    projected: -(newTx.amount - available)
                };
            }
        } else {
            // For debit/cash, check balance
            const projectedBalance = selectedAccount.balance - newTx.amount;
            if (projectedBalance < 0) {
                return {
                    type: 'negative_balance',
                    message: `Fondos insuficientes. Saldo actual: ${selectedAccount.currency === 'USD' ? '$' : 'C$'} ${selectedAccount.balance.toLocaleString()}`,
                    projected: projectedBalance
                };
            }
        }
        return null;
    }, [newTx.accountId, newTx.amount, newTx.isIncome, accounts]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAccount = accountFilter === 'all' || (tx as any).accountId === accountFilter;
            const matchesCategory = categoryFilter === 'all' || (tx as any).categoryId === categoryFilter;

            const txDate = new Date(tx.dueDate);
            const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom);
            const matchesDateTo = !dateTo || txDate <= new Date(dateTo);

            return matchesSearch && matchesAccount && matchesCategory && matchesDateFrom && matchesDateTo;
        });
    }, [transactions, searchTerm, accountFilter, categoryFilter, dateFrom, dateTo]);

    const { recurringPending, mainHistory } = useMemo(() => {
        return {
            recurringPending: filteredTransactions.filter(tx => tx.status === 'pending' && tx.recurringTransactionId),
            mainHistory: filteredTransactions.filter(tx => tx.status === 'applied' || (tx.status === 'pending' && !tx.recurringTransactionId))
        };
    }, [filteredTransactions]);

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            const [txRes, accRes, catRes] = await Promise.all([
                fetch(`${config.API_URL}/flowcontrol/transactions${filter !== 'all' ? `?status=${filter}` : ''}`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/accounts`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/categories`, { headers })
            ]);

            if (txRes.ok) setTransactions(await txRes.json());
            if (accRes.ok) setAccounts(await accRes.json());
            if (catRes.ok) setCategories(await catRes.json());
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter]);

    const openEditModal = (tx: Transaction) => {
        setEditingTxId(tx.id);
        setNewTx({
            accountId: (tx as any).accountId || '', // We might need to handle this if not in main interface
            categoryId: (tx as any).categoryId || '',
            amount: Math.abs(tx.amount),
            currency: tx.currency,
            description: tx.description,
            dueDate: tx.dueDate.split('T')[0],
            isIncome: tx.amount > 0,
            exchangeRate: tx.exchangeRate
        });
        setShowForm(true);
    };

    const saveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = newTx.isIncome ? Math.abs(newTx.amount) : -Math.abs(newTx.amount);

        try {
            const url = editingTxId
                ? `${config.API_URL}/flowcontrol/transactions/${editingTxId}`
                : `${config.API_URL}/flowcontrol/transactions`;

            const method = editingTxId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newTx,
                    amount,
                    currency: newTx.currency,
                    exchangeRate: newTx.exchangeRate,
                    categoryId: newTx.categoryId || undefined
                })
            });

            if (res.ok) {
                fetchData();
                setShowForm(false);
                setEditingTxId(null);
                setNewTx({
                    accountId: '',
                    categoryId: '',
                    amount: 0,
                    currency: 'NIO',
                    description: '',
                    dueDate: new Date().toISOString().split('T')[0],
                    isIncome: false,
                    exchangeRate: null
                });
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const toggleStatus = async (id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        // If it's pending, we open the "Apply Modal" to select account
        if (tx.status === 'pending') {
            setTxToApply(tx);
            setApplyAccountId(tx.accountId || '');
            setShowApplyModal(true);
            return;
        }

        // If it's applied, we just revert to pending (confirming)
        if (!confirm('¿Deseas marcar esta transacción como PENDIENTE? Se revertirá el impacto en el saldo.')) return;

        try {
            await fetch(`${config.API_URL}/flowcontrol/transactions/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const confirmApply = async () => {
        if (!txToApply || !applyAccountId) return;
        setIsApplying(true);

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/transactions/${txToApply.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'applied',
                    accountId: applyAccountId
                })
            });

            if (res.ok) {
                setShowApplyModal(false);
                setTxToApply(null);
                fetchData();
            }
        } catch (err) {
            console.error('Error applying transaction:', err);
        } finally {
            setIsApplying(false);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!confirm('¿Eliminar esta transacción?')) return;

        try {
            await fetch(`${config.API_URL}/flowcontrol/transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleExport = (format: 'xlsx' | 'csv') => {
        const options = {
            fileName: `transacciones_${new Date().toISOString().split('T')[0]}`,
            sheetName: 'Transacciones',
            columns: [
                { header: 'Fecha', dataKey: 'dueDate' },
                { header: 'Descripción', dataKey: 'description' },
                { header: 'Monto', dataKey: 'amount' },
                { header: 'Moneda', dataKey: 'currency' },
                { header: 'Cuenta', dataKey: 'accountName' },
                { header: 'Categoría', dataKey: 'categoryName' },
                { header: 'Estado', dataKey: 'status' }
            ],
            data: filteredTransactions.map(tx => ({
                ...tx,
                dueDate: new Date(tx.dueDate).toLocaleDateString(),
                accountName: tx.account.name,
                categoryName: tx.category?.name || 'N/A',
                status: tx.status === 'applied' ? 'Aplicada' : 'Pendiente'
            }))
        };

        if (format === 'xlsx') {
            exportService.exportToExcel(options);
        } else {
            exportService.exportToCSV(options);
        }
        setShowExportMenu(false);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-NI', {
            day: '2-digit',
            month: 'short'
        });
    };

    const isOverdue = (dueDate: string, status: string) => {
        const today = DateUtils.getTodayString();
        return status === 'pending' && DateUtils.isBefore(dueDate.split('T')[0], today);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <RefreshCw size={48} className="text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/flowcontrol" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold">Transacciones</h1>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex bg-slate-900 rounded-lg overflow-hidden">
                            {['all', 'pending', 'applied'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-4 py-2 text-sm transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Aplicadas'}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                            >
                                <Download size={18} /> Exportar
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                    <button
                                        onClick={() => handleExport('xlsx')}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-800 flex items-center gap-3 transition-colors text-slate-300"
                                    >
                                        <FileText size={16} className="text-emerald-500" /> Excel (.xlsx)
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-800 flex items-center gap-3 transition-colors text-slate-300 border-t border-slate-800"
                                    >
                                        <FileText size={16} className="text-blue-500" /> CSV (.csv)
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            <Plus size={18} /> Nueva
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar por descripción..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2">
                                <Calendar size={16} className="text-slate-500" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="bg-transparent text-sm outline-none p-1 text-slate-300"
                                />
                                <span className="text-slate-500">-</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="bg-transparent text-sm outline-none p-1 text-slate-300"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={accountFilter}
                            onChange={e => setAccountFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
                        >
                            <option value="all">Todas las Cuentas</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
                        >
                            <option value="all">Todas las Categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        {(searchTerm || dateFrom || dateTo || accountFilter !== 'all' || categoryFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setDateFrom('');
                                    setDateTo('');
                                    setAccountFilter('all');
                                    setCategoryFilter('all');
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                            >
                                <X size={14} /> Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-6">
                                {editingTxId ? 'Editar Transacción' : 'Nueva Transacción'}
                            </h2>

                            <form onSubmit={saveTransaction} className="space-y-4">
                                {/* Type Toggle */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewTx({ ...newTx, isIncome: false })}
                                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${!newTx.isIncome ? 'bg-rose-600' : 'bg-slate-800'
                                            }`}
                                    >
                                        <TrendingDown size={18} /> Gasto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewTx({ ...newTx, isIncome: true })}
                                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${newTx.isIncome ? 'bg-emerald-600' : 'bg-slate-800'
                                            }`}
                                    >
                                        <TrendingUp size={18} /> Ingreso
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        value={newTx.description}
                                        onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                                        placeholder="Ej: Luz, Agua, Salario..."
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Monto (ej: 100/3, 500*0.15)</label>
                                        <CalculatorInput
                                            value={newTx.amount}
                                            onChange={(val) => setNewTx({ ...newTx, amount: val })}
                                            placeholder="0.00 o expresión"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Moneda</label>
                                        <select
                                            value={newTx.currency}
                                            onChange={e => setNewTx({ ...newTx, currency: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="NIO">C$ Córdobas</option>
                                            <option value="USD">$ Dólares</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Cuenta</label>
                                        <select
                                            value={newTx.accountId}
                                            onChange={e => setNewTx({ ...newTx, accountId: e.target.value })}
                                            required
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                                        <input
                                            type="date"
                                            value={newTx.dueDate}
                                            onChange={e => setNewTx({ ...newTx, dueDate: e.target.value })}
                                            required
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {newTx.currency === 'USD' && (
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Tipo de Cambio (opcional)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newTx.exchangeRate || ''}
                                            onChange={e => setNewTx({ ...newTx, exchangeRate: parseFloat(e.target.value) || null })}
                                            placeholder="Ej: 36.50"
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            Se usará al aplicar la transacción
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Categoría (opcional)</label>
                                    <select
                                        value={newTx.categoryId}
                                        onChange={e => setNewTx({ ...newTx, categoryId: e.target.value })}
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Sin categoría</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Balance Warning */}
                                {balanceWarning && (
                                    <div className="p-3 bg-amber-500/20 border border-amber-500 rounded-lg text-amber-300 text-sm">
                                        <strong>⚠️ Advertencia:</strong> {balanceWarning.message}
                                        <div className="text-xs mt-1 text-amber-400">
                                            Saldo proyectado: {balanceWarning.projected.toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditingTxId(null);
                                        }}
                                        className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={`flex-1 p-3 rounded-lg transition-colors font-semibold ${newTx.isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                            }`}
                                    >
                                        {editingTxId ? 'Guardar Cambios' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Apply Confirmation Modal */}
                {showApplyModal && txToApply && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-sm border border-slate-800 shadow-2xl">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-emerald-400">
                                <Check size={20} /> Aplicar Pago
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                "{txToApply.description}" por <strong>{txToApply.currency} {Math.abs(txToApply.amount).toLocaleString()}</strong>
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Pagar desde la cuenta:</label>
                                    <select
                                        value={applyAccountId}
                                        onChange={e => setApplyAccountId(e.target.value)}
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-emerald-500 outline-none"
                                    >
                                        <option value="">Seleccionar cuenta...</option>
                                        {accounts
                                            .filter(acc => acc.currency === txToApply.currency || acc.type === 'cash') // Simplified filter
                                            .map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name} (Saldo: {acc.currency === 'USD' ? '$' : 'C$'} {acc.balance.toLocaleString()})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowApplyModal(false)}
                                        className="flex-1 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                                        disabled={isApplying}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmApply}
                                        className="flex-1 p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors text-sm font-bold disabled:opacity-50"
                                        disabled={!applyAccountId || isApplying}
                                    >
                                        {isApplying ? 'Aplicando...' : 'Confirmar Pago'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recurring Section */}
                {recurringPending.length > 0 && filter !== 'applied' && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <RefreshCw size={18} className="text-indigo-400 animate-spin-slow" />
                            <h2 className="text-lg font-bold text-white">Deudas Recurrentes por Aplicar (Mes)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recurringPending.map(tx => (
                                <div
                                    key={tx.id}
                                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-indigo-500/50 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                <Calendar size={16} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white truncate max-w-[120px]">{tx.description}</p>
                                                <p className={`text-xs ${isOverdue(tx.dueDate, tx.status) ? 'text-red-400' : 'text-slate-500'}`}>
                                                    Vence: {formatDate(tx.dueDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleStatus(tx.id)}
                                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                                            title="Aplicar ahora"
                                        >
                                            <Check size={18} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <div className="text-xs text-slate-500">
                                            Sugerido: <span className="text-slate-400">{tx.account.name}</span>
                                        </div>
                                        <div className="font-mono text-lg font-bold text-indigo-400">
                                            {tx.currency} {Math.abs(tx.amount).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-slate-400" />
                    <h2 className="text-lg font-bold text-white">Historial de Transacciones</h2>
                </div>

                {/* Transactions List */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Estado</th>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Fecha</th>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Descripción</th>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Cuenta</th>
                                <th className="text-right p-4 text-sm text-slate-400 font-medium">Monto</th>
                                <th className="w-10 p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {mainHistory.map(tx => (
                                <tr
                                    key={tx.id}
                                    className={`border-t border-slate-800 hover:bg-slate-800/50 ${isOverdue(tx.dueDate, tx.status) ? 'bg-red-900/10' : ''
                                        }`}
                                >
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleStatus(tx.id)}
                                            className={`p-2 rounded-lg transition-colors ${tx.status === 'applied'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : isOverdue(tx.dueDate, tx.status)
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-slate-700 text-slate-400'
                                                }`}
                                        >
                                            {tx.status === 'applied' ? <Check size={16} /> : <Clock size={16} />}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-sm ${isOverdue(tx.dueDate, tx.status) ? 'text-red-400' : 'text-slate-400'
                                            }`}>
                                            {formatDate(tx.dueDate)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-white">{tx.description}</span>
                                        {tx.category && (
                                            <span
                                                className="ml-2 text-xs px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: tx.category.color + '20', color: tx.category.color }}
                                            >
                                                {tx.category.name}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className="text-sm px-2 py-1 rounded-lg"
                                            style={{ backgroundColor: tx.account.color + '20', color: tx.account.color }}
                                        >
                                            {tx.account.name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <DualCurrency
                                            amount={Number(tx.amount)}
                                            currency={tx.currency}
                                            exchangeRate={tx.exchangeRate || exchangeRate}
                                            displayCurrency={displayCurrency}
                                            size="sm"
                                            className={Number(tx.amount) > 0 ? 'text-emerald-400' : 'text-rose-400'}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => openEditModal(tx)}
                                                className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteTransaction(tx.id)}
                                                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {mainHistory.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <Clock size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay transacciones {filter !== 'all' ? filter === 'pending' ? 'pendientes' : 'aplicadas' : ''}</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
