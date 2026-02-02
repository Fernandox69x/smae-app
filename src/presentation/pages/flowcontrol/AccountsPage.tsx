import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    CreditCard,
    Wallet,
    Banknote,
    Edit2,
    Building2,
    ArrowRightLeft
} from 'lucide-react';
import { config } from '../../../config';
import DualCurrency, { useCurrencySettings } from '../../components/DualCurrency/DualCurrency';
import { CalculatorInput } from '../../components/flowcontrol/CalculatorInput';

interface Account {
    id: string;
    name: string;
    bank: string | null;
    type: string;
    currency: string;
    balance: number;
    creditLimit: number | null;
    usedCredit: number;
    availableCredit: number | null;
    color: string;
}

const BANKS = ['BAC', 'Banpro', 'Lafise', 'BDF', 'Ficohsa', 'Avanz', 'Bancentro', 'Otro'];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#22c55e', '#14b8a6', '#0ea5e9'];

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [newAccount, setNewAccount] = useState({
        name: '',
        bank: '',
        type: 'debit',
        currency: 'NIO',
        balance: 0,
        creditLimit: 0,
        color: '#6366f1'
    });
    const [loading, setLoading] = useState(true);

    // Transfer state
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transfer, setTransfer] = useState({
        fromAccountId: '',
        toAccountId: '',
        amount: 0,
        description: ''
    });
    const [transferError, setTransferError] = useState<string | null>(null);
    const [transferLoading, setTransferLoading] = useState(false);

    const token = localStorage.getItem('token');

    // Currency settings
    const { exchangeRate, displayCurrency } = useCurrencySettings();

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/accounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const createAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/accounts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAccount)
            });

            if (res.ok) {
                fetchAccounts();
                setShowForm(false);
                setNewAccount({ name: '', bank: '', type: 'debit', currency: 'NIO', balance: 0, creditLimit: 0, color: '#6366f1' });
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const deleteAccount = async (id: string) => {
        if (!confirm('¿Eliminar esta cuenta?')) return;

        try {
            await fetch(`${config.API_URL}/flowcontrol/accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchAccounts();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const updateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccount) return;

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/accounts/${editingAccount.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editingAccount.name,
                    bank: editingAccount.bank,
                    type: editingAccount.type,
                    currency: editingAccount.currency,
                    balance: editingAccount.balance,
                    creditLimit: editingAccount.creditLimit,
                    color: editingAccount.color
                })
            });

            if (res.ok) {
                fetchAccounts();
                setEditingAccount(null);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    // Execute transfer between accounts
    const executeTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransferError(null);
        setTransferLoading(true);

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/transfers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromAccountId: transfer.fromAccountId,
                    toAccountId: transfer.toAccountId,
                    amountFrom: transfer.amount,
                    description: transfer.description,
                    exchangeRate
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setTransferError(data.error || 'Error al realizar transferencia');
                setTransferLoading(false);
                return;
            }

            // Success - refresh and close
            fetchAccounts();
            setShowTransferModal(false);
            setTransfer({ fromAccountId: '', toAccountId: '', amount: 0, description: '' });
        } catch (err) {
            setTransferError('Error de conexión');
        } finally {
            setTransferLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'credit': return <CreditCard size={20} />;
            case 'cash': return <Banknote size={20} />;
            default: return <Wallet size={20} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/flowcontrol" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold">Mis Cuentas</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ArrowRightLeft size={18} /> Transferir
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            <Plus size={18} /> Nueva Cuenta
                        </button>
                    </div>
                </div>

                {/* Transfer Modal */}
                {showTransferModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <ArrowRightLeft size={24} className="text-indigo-400" />
                                Transferir entre Cuentas
                            </h2>

                            {transferError && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
                                    {transferError}
                                </div>
                            )}

                            <form onSubmit={executeTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Desde (Origen)</label>
                                    <select
                                        value={transfer.fromAccountId}
                                        onChange={e => setTransfer({ ...transfer, fromAccountId: e.target.value })}
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Seleccionar cuenta origen</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.currency === 'USD' ? '$' : 'C$'} {acc.type === 'credit'
                                                    ? (acc.availableCredit || 0).toLocaleString()
                                                    : acc.balance.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Hacia (Destino)</label>
                                    <select
                                        value={transfer.toAccountId}
                                        onChange={e => setTransfer({ ...transfer, toAccountId: e.target.value })}
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Seleccionar cuenta destino</option>
                                        {accounts
                                            .filter(acc => acc.id !== transfer.fromAccountId)
                                            .map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name} ({acc.currency})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Monto (ej: 100/3)</label>
                                    <CalculatorInput
                                        value={transfer.amount}
                                        onChange={(val) => setTransfer({ ...transfer, amount: val })}
                                        placeholder="0.00 o expresión"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Descripción (opcional)</label>
                                    <input
                                        type="text"
                                        value={transfer.description}
                                        onChange={e => setTransfer({ ...transfer, description: e.target.value })}
                                        placeholder="Ej: Retiro para gastos"
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowTransferModal(false);
                                            setTransferError(null);
                                        }}
                                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={transferLoading || !transfer.fromAccountId || !transfer.toAccountId || transfer.amount <= 0}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {transferLoading ? 'Transfiriendo...' : 'Transferir'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
                            <h2 className="text-xl font-bold mb-6">Nueva Cuenta</h2>

                            <form onSubmit={createAccount} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={newAccount.name}
                                        onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                        placeholder="Ej: Visa Banpro"
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                                        <select
                                            value={newAccount.type}
                                            onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="cash">Efectivo</option>
                                            <option value="debit">Débito</option>
                                            <option value="credit">Crédito</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Moneda</label>
                                        <select
                                            value={newAccount.currency}
                                            onChange={e => setNewAccount({ ...newAccount, currency: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="NIO">C$ Córdobas</option>
                                            <option value="USD">$ Dólares</option>
                                        </select>
                                    </div>
                                </div>

                                {newAccount.type !== 'cash' && (
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Banco</label>
                                        <select
                                            value={newAccount.bank}
                                            onChange={e => setNewAccount({ ...newAccount, bank: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">Seleccionar banco</option>
                                            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {newAccount.type !== 'credit' ? (
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Saldo Inicial</label>
                                            <CalculatorInput
                                                value={newAccount.balance}
                                                onChange={(val) => setNewAccount({ ...newAccount, balance: val })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Límite de Crédito</label>
                                            <CalculatorInput
                                                value={newAccount.creditLimit}
                                                onChange={(val) => setNewAccount({ ...newAccount, creditLimit: val })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setNewAccount({ ...newAccount, color: c })}
                                                    className={`w-8 h-8 rounded-lg ${newAccount.color === c ? 'ring-2 ring-white' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-semibold"
                                    >
                                        Crear Cuenta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingAccount && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
                            <h2 className="text-xl font-bold mb-6">Editar Cuenta</h2>

                            <form onSubmit={updateAccount} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={editingAccount.name}
                                        onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                                        <select
                                            value={editingAccount.type}
                                            onChange={e => setEditingAccount({ ...editingAccount, type: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="cash">Efectivo</option>
                                            <option value="debit">Débito</option>
                                            <option value="credit">Crédito</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Moneda</label>
                                        <select
                                            value={editingAccount.currency}
                                            onChange={e => setEditingAccount({ ...editingAccount, currency: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="NIO">C$ Córdobas</option>
                                            <option value="USD">$ Dólares</option>
                                        </select>
                                    </div>
                                </div>

                                {editingAccount.type !== 'cash' && (
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Banco</label>
                                        <select
                                            value={editingAccount.bank || ''}
                                            onChange={e => setEditingAccount({ ...editingAccount, bank: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">Seleccionar banco</option>
                                            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {editingAccount.type !== 'credit' ? (
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Saldo</label>
                                            <CalculatorInput
                                                value={editingAccount.balance}
                                                onChange={(val) => setEditingAccount({ ...editingAccount, balance: val })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Límite de Crédito</label>
                                            <CalculatorInput
                                                value={editingAccount.creditLimit || 0}
                                                onChange={(val) => setEditingAccount({ ...editingAccount, creditLimit: val })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setEditingAccount({ ...editingAccount, color: c })}
                                                    className={`w-8 h-8 rounded-lg ${editingAccount.color === c ? 'ring-2 ring-white' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingAccount(null)}
                                        className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-semibold"
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Accounts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map(acc => (
                        <div
                            key={acc.id}
                            className="bg-slate-900 p-5 rounded-xl border-l-4 hover:bg-slate-800/50 transition-colors"
                            style={{ borderLeftColor: acc.color }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <span style={{ color: acc.color }}>{getIcon(acc.type)}</span>
                                    <div>
                                        <h3 className="font-bold text-white">{acc.name}</h3>
                                        <p className="text-sm text-slate-500">
                                            {acc.bank && <><Building2 className="inline" size={12} /> {acc.bank} • </>}
                                            {acc.currency}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setEditingAccount(acc)}
                                        className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                                        title="Editar cuenta"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteAccount(acc.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                        title="Eliminar cuenta"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800">
                                {acc.type === 'credit' ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Usado</span>
                                            <DualCurrency
                                                amount={acc.usedCredit}
                                                currency={acc.currency}
                                                exchangeRate={exchangeRate}
                                                displayCurrency={displayCurrency}
                                                size="sm"
                                                className="text-rose-400"
                                            />
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Disponible</span>
                                            <DualCurrency
                                                amount={acc.availableCredit || 0}
                                                currency={acc.currency}
                                                exchangeRate={exchangeRate}
                                                displayCurrency={displayCurrency}
                                                size="sm"
                                                className="text-emerald-400"
                                            />
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full bg-rose-500 transition-all"
                                                style={{ width: acc.creditLimit ? `${(acc.usedCredit / acc.creditLimit) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 text-right">
                                            Límite: {acc.currency === 'USD' ? '$' : 'C$'} {(acc.creditLimit || 0).toLocaleString()}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <DualCurrency
                                            amount={acc.balance}
                                            currency={acc.currency}
                                            exchangeRate={exchangeRate}
                                            displayCurrency={displayCurrency}
                                            size="lg"
                                            className={acc.balance < 0 ? 'text-red-400' : 'text-emerald-400'}
                                        />
                                        <p className="text-xs text-slate-500">Saldo disponible</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {accounts.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <Wallet size={48} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Sin Cuentas</h3>
                        <p className="text-slate-500 mb-4">Agrega tu primera cuenta para empezar</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            <Plus className="inline mr-2" size={18} /> Agregar Cuenta
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
