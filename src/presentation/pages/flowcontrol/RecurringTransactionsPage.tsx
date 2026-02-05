import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    RefreshCw,
    Calendar,
    Settings,
    Clock
} from 'lucide-react';
import { config } from '../../../config';
import DualCurrency, { useCurrencySettings } from '../../components/DualCurrency/DualCurrency';

interface RecurringTransaction {
    id: string;
    description: string;
    amount: number;
    currency: string;
    frequency: string;
    startDate: string;
    nextDueDate: string;
    isActive: boolean;
    accountId: string;
    categoryId: string | null;
    account: { name: string; color: string; currency: string };
    category: { name: string; color: string; icon: string } | null;
}

interface Account {
    id: string;
    name: string;
    currency: string;
    color: string;
}

interface Category {
    id: string;
    name: string;
    color: string;
}

export default function RecurringTransactionsPage() {
    const [templates, setTemplates] = useState<RecurringTransaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { exchangeRate, displayCurrency } = useCurrencySettings();
    const token = localStorage.getItem('token');

    const [form, setForm] = useState({
        description: '',
        amount: 0,
        currency: 'NIO',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date().toISOString().split('T')[0],
        accountId: '',
        categoryId: '',
        isIncome: false
    });

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [tempRes, accRes, catRes] = await Promise.all([
                fetch(`${config.API_URL}/flowcontrol/recurring-transactions`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/accounts`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/categories`, { headers })
            ]);

            if (tempRes.ok) setTemplates(await tempRes.json());
            if (accRes.ok) setAccounts(await accRes.json());
            if (catRes.ok) setCategories(await catRes.json());
        } catch (err) {
            console.error('Error fetching data:', err);
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
            const url = editingId
                ? `${config.API_URL}/flowcontrol/recurring-transactions/${editingId}`
                : `${config.API_URL}/flowcontrol/recurring-transactions`;

            const finalAmount = form.isIncome ? Math.abs(Number(form.amount)) : -Math.abs(Number(form.amount));

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    amount: finalAmount,
                    categoryId: form.categoryId || null
                })
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setForm({
                    description: '',
                    amount: 0,
                    currency: 'NIO',
                    frequency: 'monthly',
                    startDate: new Date().toISOString().split('T')[0],
                    nextDueDate: new Date().toISOString().split('T')[0],
                    accountId: '',
                    categoryId: '',
                    isIncome: false
                });
                fetchData();
            }
        } catch (err) {
            console.error('Error saving template:', err);
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta suscripción? No se generarán más transacciones automáticas.')) return;
        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/recurring-transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Error deleting template:', err);
        }
    };

    const openEdit = (t: RecurringTransaction) => {
        setEditingId(t.id);
        setForm({
            description: t.description,
            amount: t.amount,
            currency: t.currency,
            frequency: t.frequency,
            startDate: t.startDate.split('T')[0],
            nextDueDate: t.nextDueDate.split('T')[0],
            accountId: t.accountId,
            categoryId: t.categoryId || '',
            isIncome: t.amount > 0
        });
        setShowForm(true);
    };

    const getFrequencyLabel = (f: string) => {
        const labels: any = {
            'daily': 'Diario',
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual',
            'yearly': 'Anual'
        };
        return labels[f] || f;
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-500"><RefreshCw className="animate-spin" size={48} /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/flowcontrol" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Gastos Recurrentes</h1>
                            <p className="text-sm text-slate-400">Gestiona tus suscripciones y pagos fijos automáticos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                description: '',
                                amount: 0,
                                currency: 'NIO',
                                frequency: 'monthly',
                                startDate: new Date().toISOString().split('T')[0],
                                nextDueDate: new Date().toISOString().split('T')[0],
                                accountId: accounts[0]?.id || '',
                                categoryId: '',
                                isIncome: false
                            });
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-semibold"
                    >
                        <Plus size={18} /> Nueva Suscripción
                    </button>
                </div>

                {/* Templates List */}
                <div className="space-y-4">
                    {templates.length === 0 ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                            <RefreshCw size={48} className="mx-auto mb-4 text-slate-700" />
                            <h3 className="text-xl font-bold text-slate-300 mb-2">No hay gastos recurrentes</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                Agrega suscripciones como Netflix, Internet o Renta para que se generen automáticamente cada mes.
                            </p>
                        </div>
                    ) : (
                        templates.map(t => (
                            <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-lg bg-slate-800 ${t.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            <Settings size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{t.description}</h3>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock size={12} /> {getFrequencyLabel(t.frequency)}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar size={12} /> Próximo: {new Date(t.nextDueDate).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300" style={{ color: t.account?.color }}>
                                                    {t.account?.name}
                                                </span>
                                                {t.category && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                                        {t.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <DualCurrency
                                            amount={t.amount}
                                            currency={t.currency}
                                            exchangeRate={exchangeRate}
                                            displayCurrency={displayCurrency}
                                            size="lg"
                                            className="font-bold text-white"
                                        />
                                        <div className="flex justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(t)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => deleteTemplate(t.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal Form */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold">{editingId ? 'Editar Suscripción' : 'Nueva Suscripción'}</h2>
                                <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><Plus className="rotate-45" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Type Toggle */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, isIncome: false })}
                                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors border ${!form.isIncome ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                    >
                                        Gasto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, isIncome: true })}
                                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors border ${form.isIncome ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                    >
                                        Ingreso
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        placeholder="Ej: Netflix, Renta, Internet..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Monto</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Moneda</label>
                                        <select
                                            value={form.currency}
                                            onChange={e => setForm({ ...form, currency: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        >
                                            <option value="NIO">Córdobas (NIO)</option>
                                            <option value="USD">Dólares (USD)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Frecuencia</label>
                                    <select
                                        value={form.frequency}
                                        onChange={e => setForm({ ...form, frequency: e.target.value })}
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    >
                                        <option value="daily">Diario</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="biweekly">Quincenal</option>
                                        <option value="monthly">Mensual</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            required
                                            value={form.startDate}
                                            onChange={e => setForm({ ...form, startDate: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Próximo Cobro</label>
                                        <input
                                            type="date"
                                            required
                                            value={form.nextDueDate}
                                            onChange={e => setForm({ ...form, nextDueDate: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Cuenta de Cargo</label>
                                    <select
                                        required
                                        value={form.accountId}
                                        onChange={e => setForm({ ...form, accountId: e.target.value })}
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Categoría</label>
                                    <select
                                        value={form.categoryId}
                                        onChange={e => setForm({ ...form, categoryId: e.target.value })}
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Sin categoría</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-semibold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-semibold"
                                    >
                                        {editingId ? 'Guardar Cambios' : 'Crear Suscripción'}
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
