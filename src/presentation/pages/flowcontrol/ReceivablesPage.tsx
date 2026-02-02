import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    User,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Edit2,
    Mail,
    FileText,
    CheckSquare,
    Square
} from 'lucide-react';
import { config } from '../../../config';
import DualCurrency, { useCurrencySettings } from '../../components/DualCurrency/DualCurrency';
import { CalculatorInput } from '../../components/flowcontrol/CalculatorInput';

interface Receivable {
    id: string;
    personName: string;
    amount: number;
    paidAmount: number;
    type: 'receivable' | 'payable';
    description: string | null;
    status: string;
    dueDate: string | null;
    currency?: string;
}

interface Account {
    id: string;
    name: string;
    currency: string;
}

export default function ReceivablesPage() {
    const [receivables, setReceivables] = useState<Receivable[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Receivable | null>(null);
    const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');

    // Currency settings
    const { exchangeRate, displayCurrency } = useCurrencySettings();

    const [newItem, setNewItem] = useState({
        personName: '',
        amount: 0,
        type: 'receivable' as 'receivable' | 'payable',
        description: '',
        dueDate: ''
    });

    const token = localStorage.getItem('token');

    // Statement generator state
    const [showStatement, setShowStatement] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [includeEmail, setIncludeEmail] = useState(true);
    const [includePhone, setIncludePhone] = useState(false);
    const [customPhone, setCustomPhone] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Get unique person names with pending debts
    const uniquePeople = useMemo(() => {
        const pending = receivables.filter(r => r.status !== 'paid');
        const names = [...new Set(pending.map(r => r.personName))];
        return names.sort();
    }, [receivables]);

    // Get items for selected person
    const personItems = useMemo(() => {
        if (!selectedPerson) return [];
        return receivables.filter(r => r.personName === selectedPerson && r.status !== 'paid');
    }, [receivables, selectedPerson]);

    // Calculate total for selected items
    const selectedTotal = useMemo(() => {
        return personItems
            .filter(r => selectedItems.includes(r.id))
            .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
    }, [personItems, selectedItems]);

    // Toggle item selection
    const toggleItem = (id: string) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Select all items for person
    const selectAllItems = () => {
        setSelectedItems(personItems.map(r => r.id));
    };

    // Generate and send email via backend
    const generateStatement = async () => {
        const selected = personItems.filter(r => selectedItems.includes(r.id));
        if (selected.length === 0 || !recipientEmail) return;

        setIsSending(true);
        try {
            const isReceivable = selected[0].type === 'receivable';
            const subject = `Estado de Cuenta - ${isReceivable ? 'Recordatorio de Pago' : 'Detalle de Deuda'}`;

            const res = await fetch(`${config.API_URL}/flowcontrol/send-statement`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: recipientEmail,
                    subject,
                    personName: selectedPerson,
                    message: customMessage,
                    items: selected,
                    total: selectedTotal,
                    includeEmail,
                    includePhone,
                    customPhone
                })
            });

            if (res.ok) {
                alert('Correo enviado exitosamente');
                setShowStatement(false);
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'No se pudo enviar el correo'}`);
            }
        } catch (err) {
            console.error('Error sending email:', err);
            alert('Error de conexión al enviar el correo');
        } finally {
            setIsSending(false);
        }
    };

    // Reset statement modal when person changes
    useEffect(() => {
        if (selectedPerson) {
            setSelectedItems(personItems.map(r => r.id)); // Select all by default
        }
    }, [selectedPerson]);

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const params = filter !== 'all' ? `?type=${filter}` : '';

            const [recRes, accRes] = await Promise.all([
                fetch(`${config.API_URL}/flowcontrol/receivables${params}`, { headers }),
                fetch(`${config.API_URL}/flowcontrol/accounts`, { headers })
            ]);

            if (recRes.ok) setReceivables(await recRes.json());
            if (accRes.ok) setAccounts(await accRes.json());
        } catch (err) {
            console.error('Error:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter]);

    const createReceivable = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/receivables`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newItem,
                    dueDate: newItem.dueDate || null
                })
            });

            if (res.ok) {
                fetchData();
                setShowForm(false);
                setNewItem({ personName: '', amount: 0, type: 'receivable', description: '', dueDate: '' });
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const settleReceivable = async (id: string, accountId: string) => {
        try {
            await fetch(`${config.API_URL}/flowcontrol/receivables/${id}/settle`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ accountId })
            });
            fetchData();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const deleteReceivable = async (id: string) => {
        if (!confirm('¿Eliminar esta cuenta por cobrar/pagar?')) return;

        try {
            await fetch(`${config.API_URL}/flowcontrol/receivables/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const updateReceivable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/receivables/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personName: editingItem.personName,
                    amount: editingItem.amount,
                    type: editingItem.type,
                    description: editingItem.description,
                    dueDate: editingItem.dueDate
                })
            });

            if (res.ok) {
                fetchData();
                setEditingItem(null);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const pendingReceivables = receivables.filter(r => r.type === 'receivable' && r.status !== 'paid');
    const pendingPayables = receivables.filter(r => r.type === 'payable' && r.status !== 'paid');

    const totalReceivable = pendingReceivables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
    const totalPayable = pendingPayables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/flowcontrol" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold">Cuentas por Cobrar/Pagar</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setShowStatement(true);
                                setSelectedPerson('');
                                setSelectedItems([]);
                                setRecipientEmail('');
                                setCustomMessage('');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Generar Estado de Cuenta"
                        >
                            <FileText size={18} /> Estado
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            <Plus size={18} /> Nueva
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-2 text-emerald-400">
                            <ArrowDownLeft size={20} />
                            <span className="text-sm">Me Deben</span>
                        </div>
                        <DualCurrency
                            amount={totalReceivable}
                            currency="NIO"
                            exchangeRate={exchangeRate}
                            displayCurrency="NIO"
                            size="lg"
                            className="text-white"
                        />
                        <span className="text-xs text-slate-500 ml-2">
                            {pendingReceivables.length} pendientes
                        </span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-2 text-rose-400">
                            <ArrowUpRight size={20} />
                            <span className="text-sm">Debo</span>
                        </div>
                        <DualCurrency
                            amount={totalPayable}
                            currency="NIO"
                            exchangeRate={exchangeRate}
                            displayCurrency="NIO"
                            size="lg"
                            className="text-white"
                        />
                        <span className="text-xs text-slate-500 ml-2">
                            {pendingPayables.length} pendientes
                        </span>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-2 mb-4">
                    {['all', 'receivable', 'payable'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            {f === 'all' ? 'Todas' : f === 'receivable' ? 'Me deben' : 'Debo'}
                        </button>
                    ))}
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
                            <h2 className="text-xl font-bold mb-6">Nueva Cuenta</h2>

                            <form onSubmit={createReceivable} className="space-y-4">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewItem({ ...newItem, type: 'receivable' })}
                                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${newItem.type === 'receivable' ? 'bg-emerald-600' : 'bg-slate-800'
                                            }`}
                                    >
                                        <ArrowDownLeft size={18} /> Me Deben
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewItem({ ...newItem, type: 'payable' })}
                                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${newItem.type === 'payable' ? 'bg-rose-600' : 'bg-slate-800'
                                            }`}
                                    >
                                        <ArrowUpRight size={18} /> Debo
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Persona</label>
                                    <input
                                        type="text"
                                        value={newItem.personName}
                                        onChange={e => setNewItem({ ...newItem, personName: e.target.value })}
                                        placeholder="Nombre de la persona"
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Monto (ej: 106*5/3)</label>
                                        <CalculatorInput
                                            value={newItem.amount}
                                            onChange={(val) => setNewItem({ ...newItem, amount: val })}
                                            placeholder="0.00 o expresión"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Fecha límite</label>
                                        <input
                                            type="date"
                                            value={newItem.dueDate}
                                            onChange={e => setNewItem({ ...newItem, dueDate: e.target.value })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        value={newItem.description}
                                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="Nota opcional"
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={`flex-1 p-3 rounded-lg font-semibold ${newItem.type === 'receivable' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                            }`}
                                    >
                                        Crear
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingItem && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
                            <h2 className="text-xl font-bold mb-6">Editar Cuenta</h2>

                            <form onSubmit={updateReceivable} className="space-y-4">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingItem({ ...editingItem, type: 'receivable' })}
                                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${editingItem.type === 'receivable' ? 'bg-emerald-600' : 'bg-slate-800'}`}
                                    >
                                        <ArrowDownLeft size={18} /> Me Deben
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingItem({ ...editingItem, type: 'payable' })}
                                        className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${editingItem.type === 'payable' ? 'bg-rose-600' : 'bg-slate-800'}`}
                                    >
                                        <ArrowUpRight size={18} /> Debo
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Persona</label>
                                    <input
                                        type="text"
                                        value={editingItem.personName}
                                        onChange={e => setEditingItem({ ...editingItem, personName: e.target.value })}
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Monto (ej: 106*5/3)</label>
                                        <CalculatorInput
                                            value={editingItem.amount}
                                            onChange={(val) => setEditingItem({ ...editingItem, amount: val })}
                                            placeholder="0.00 o expresión"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Fecha límite</label>
                                        <input
                                            type="date"
                                            value={editingItem.dueDate?.split('T')[0] || ''}
                                            onChange={e => setEditingItem({ ...editingItem, dueDate: e.target.value || null })}
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        value={editingItem.description || ''}
                                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingItem(null)}
                                        className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold"
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Statement Generator Modal */}
                {showStatement && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-lg border border-slate-800 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Mail size={20} className="text-indigo-400" />
                                Generar Estado de Cuenta
                            </h2>

                            <div className="space-y-4">
                                {/* Person selector */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Persona</label>
                                    <select
                                        value={selectedPerson}
                                        onChange={e => setSelectedPerson(e.target.value)}
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Seleccionar persona...</option>
                                        {uniquePeople.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Items list */}
                                {selectedPerson && personItems.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm text-slate-400">Conceptos a incluir</label>
                                            <button
                                                type="button"
                                                onClick={selectAllItems}
                                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                            >
                                                Seleccionar todos
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {personItems.map(item => {
                                                const pending = item.amount - item.paidAmount;
                                                const isSelected = selectedItems.includes(item.id);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleItem(item.id)}
                                                        className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${isSelected ? 'bg-indigo-600/20 border border-indigo-500/50' : 'bg-slate-800 border border-slate-700'
                                                            }`}
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare size={18} className="text-indigo-400 flex-shrink-0" />
                                                        ) : (
                                                            <Square size={18} className="text-slate-500 flex-shrink-0" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {item.description || 'Sin descripción'}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Sin fecha'}
                                                            </p>
                                                        </div>
                                                        <span className={`font-semibold ${item.type === 'receivable' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            C$ {pending.toLocaleString()}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Total */}
                                        <div className="mt-3 p-3 bg-slate-800 rounded-lg flex items-center justify-between">
                                            <span className="text-slate-400">Total seleccionado:</span>
                                            <span className="text-xl font-bold text-white">
                                                C$ {selectedTotal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* No items message */}
                                {selectedPerson && personItems.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        No hay deudas pendientes con esta persona
                                    </div>
                                )}

                                {/* Email input */}
                                {selectedItems.length > 0 && (
                                    <>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Correo destinatario (opcional)</label>
                                            <input
                                                type="email"
                                                value={recipientEmail}
                                                onChange={e => setRecipientEmail(e.target.value)}
                                                placeholder="correo@ejemplo.com"
                                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Mensaje personalizado (opcional)</label>
                                            <textarea
                                                value={customMessage}
                                                onChange={e => setCustomMessage(e.target.value)}
                                                placeholder="Ej: Te envío el detalle de lo pendiente..."
                                                rows={2}
                                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none resize-none"
                                            />
                                        </div>

                                        <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Opciones de contacto</p>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div
                                                    onClick={() => setIncludeEmail(!includeEmail)}
                                                    className={`p-1 rounded border ${includeEmail ? 'bg-indigo-600 border-indigo-500' : 'border-slate-600'}`}
                                                >
                                                    {includeEmail && <CheckSquare size={14} />}
                                                    {!includeEmail && <div className="w-[14px] h-[14px]" />}
                                                </div>
                                                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Incluir mi correo electrónico</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div
                                                    onClick={() => setIncludePhone(!includePhone)}
                                                    className={`p-1 rounded border ${includePhone ? 'bg-indigo-600 border-indigo-500' : 'border-slate-600'}`}
                                                >
                                                    {includePhone && <CheckSquare size={14} />}
                                                    {!includePhone && <div className="w-[14px] h-[14px]" />}
                                                </div>
                                                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Incluir mi teléfono/WhatsApp</span>
                                            </label>

                                            {includePhone && (
                                                <div className="mt-2 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <input
                                                        type="text"
                                                        value={customPhone}
                                                        onChange={e => setCustomPhone(e.target.value)}
                                                        placeholder="Nº de teléfono para contacto"
                                                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowStatement(false)}
                                        className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg"
                                        disabled={isSending}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={generateStatement}
                                        disabled={selectedItems.length === 0 || isSending || !recipientEmail}
                                        className="flex-1 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSending ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Mail size={18} /> Enviar Estado
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="space-y-3">
                    {receivables.map(r => (
                        <div
                            key={r.id}
                            className={`bg-slate-900 p-4 rounded-xl border-l-4 ${r.type === 'receivable' ? 'border-l-emerald-500' : 'border-l-rose-500'
                                } ${r.status === 'paid' ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${r.type === 'receivable' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                        }`}>
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{r.personName}</h3>
                                        {r.description && (
                                            <p className="text-sm text-slate-500">{r.description}</p>
                                        )}
                                        {r.dueDate && (
                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Calendar size={12} />
                                                {new Date(r.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <DualCurrency
                                        amount={r.amount - r.paidAmount}
                                        currency={r.currency || 'NIO'}
                                        exchangeRate={exchangeRate}
                                        displayCurrency={displayCurrency}
                                        size="md"
                                        className={r.type === 'receivable' ? 'text-emerald-400' : 'text-rose-400'}
                                    />
                                    {r.paidAmount > 0 && (
                                        <span className="text-xs text-slate-500 block">
                                            de C$ {r.amount.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-800">
                                {r.status !== 'paid' && (
                                    <select
                                        onChange={(e) => e.target.value && settleReceivable(r.id, e.target.value)}
                                        className="p-2 bg-slate-800 rounded-lg text-sm"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Liquidar a cuenta...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    onClick={() => setEditingItem(r)}
                                    className="p-2 text-slate-500 hover:text-indigo-400"
                                    title="Editar"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => deleteReceivable(r.id)}
                                    className="p-2 text-slate-500 hover:text-red-400"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {receivables.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <User size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay cuentas por cobrar/pagar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
