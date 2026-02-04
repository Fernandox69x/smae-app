import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingBag,
    Plus,
    Search,
    Filter,
    ChevronRight,
    AlertCircle,
    Package,
    TrendingUp,
    Home,
    Trash2,
    CheckCircle2,
    History,
    Store,
    ArrowLeft,
    Loader2,
    Edit2,
    X
} from 'lucide-react';
import { config } from '../../../config';
import { CalculatorInput } from '../../components/flowcontrol/CalculatorInput';

interface PurchaseHistory {
    id: string;
    price: number;
    currency: string;
    store: string;
    purchaseDate: string;
}

interface ShoppingItem {
    id: string;
    name: string;
    category: string | null;
    isInStock: boolean;
    priority: 'low' | 'medium' | 'high';
    targetQuantity: number | null;
    unit: string | null;
    notes: string | null;
    history: PurchaseHistory[];
}

export default function ShoppingListPage() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [activeTab, setActiveTab] = useState<'shopping' | 'pantry'>('shopping');

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState<ShoppingItem | null>(null);
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

    // Form state for new/edit item
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        priority: 'medium',
        targetQuantity: '',
        unit: '',
        notes: ''
    });

    // Form state for recording purchase
    const [purchaseData, setPurchaseData] = useState({
        price: '',
        currency: 'NIO',
        store: '',
        quantity: '',
        notes: ''
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch(`${config.API_URL}/shopping/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Error fetching shopping items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem
                ? `${config.API_URL}/shopping/items/${editingItem.id}`
                : `${config.API_URL}/shopping/items`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    targetQuantity: formData.targetQuantity ? Number(formData.targetQuantity) : null
                })
            });

            if (res.ok) {
                setShowForm(false);
                setEditingItem(null);
                setFormData({ name: '', category: '', priority: 'medium', targetQuantity: '', unit: '', notes: '' });
                fetchItems();
            }
        } catch (error) {
            console.error('Error saving shopping item:', error);
        }
    };

    const handleToggleStock = async (item: ShoppingItem) => {
        try {
            const res = await fetch(`${config.API_URL}/shopping/items/${item.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isInStock: !item.isInStock })
            });

            if (res.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error('Error toggling stock:', error);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
        try {
            const res = await fetch(`${config.API_URL}/shopping/items/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleRecordPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showPurchaseModal) return;

        try {
            const res = await fetch(`${config.API_URL}/shopping/purchase`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    itemId: showPurchaseModal.id,
                    ...purchaseData,
                    price: Number(purchaseData.price),
                    quantity: purchaseData.quantity ? Number(purchaseData.quantity) : null
                })
            });

            if (res.ok) {
                setShowPurchaseModal(null);
                setPurchaseData({ price: '', currency: 'NIO', store: '', quantity: '', notes: '' });
                fetchItems();
            }
        } catch (error) {
            console.error('Error recording purchase:', error);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filter.toLowerCase()) ||
            (item.category?.toLowerCase().includes(filter.toLowerCase()));

        if (activeTab === 'shopping') {
            return matchesSearch && !item.isInStock;
        }
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Link to="/flowcontrol" className="hover:text-emerald-400 transition-colors">FlowControl</Link>
                            <ChevronRight size={14} />
                            <span className="text-slate-300">Despensa</span>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Gestión de Despensa
                        </h1>
                    </div>

                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData({ name: '', category: '', priority: 'medium', targetQuantity: '', unit: '', notes: '' });
                            setShowForm(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                    >
                        <Plus size={20} />
                        Nuevo Producto
                    </button>
                </div>

                {/* Tabs & Search */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setActiveTab('shopping')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${activeTab === 'shopping' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ShoppingBag size={18} />
                            Lista de Compras
                            {items.filter(i => !i.isInStock).length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                    {items.filter(i => !i.isInStock).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('pantry')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${activeTab === 'pantry' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Package size={18} />
                            Inventario / Despensa
                        </button>
                    </div>

                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar producto o categoría..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-12 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                        <ShoppingBag size={64} className="text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">No hay productos</h3>
                        <p className="text-slate-500 mt-2">Agrega productos que consumes regularmente para llevar el control.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className={`group relative bg-slate-900 border ${item.isInStock ? 'border-slate-800' : 'border-red-500/30 bg-red-500/5'} rounded-2xl p-6 transition-all hover:border-slate-700 hover:shadow-xl`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                            <span className="text-[10px] uppercase font-bold text-slate-500">{item.category || 'Sin categoría'}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">
                                            {item.name}
                                        </h3>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingItem(item);
                                                setFormData({
                                                    name: item.name,
                                                    category: item.category || '',
                                                    priority: item.priority,
                                                    targetQuantity: item.targetQuantity?.toString() || '',
                                                    unit: item.unit || '',
                                                    notes: item.notes || ''
                                                });
                                                setShowForm(true);
                                            }}
                                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="p-2 bg-slate-800 hover:bg-red-900/50 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Estado</p>
                                        <div className="flex items-center gap-2">
                                            {item.isInStock ? (
                                                <>
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                    <span className="text-sm font-medium text-emerald-400">En Despensa</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={16} className="text-red-400" />
                                                    <span className="text-sm font-medium text-red-400">Agotado</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {item.targetQuantity && (
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Stock Ideal</p>
                                            <p className="text-sm font-bold text-white">
                                                {item.targetQuantity} <span className="text-slate-500 font-normal">{item.unit}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* History Mini Info */}
                                {item.history.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                                            <span>Última Compra</span>
                                            <span className="flex items-center gap-1"><Store size={10} /> {item.history[0].store}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                                            <span className="text-emerald-400 font-bold text-sm">
                                                {item.history[0].currency} {Number(item.history[0].price).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(item.history[0].purchaseDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {!item.isInStock ? (
                                        <button
                                            onClick={() => {
                                                setShowPurchaseModal(item);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                                        >
                                            <CheckCircle2 size={18} />
                                            Registrar Compra
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleToggleStock(item)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                                        >
                                            <X size={18} />
                                            Se Agotó
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal (New/Edit) */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Nombre del Producto</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                    placeholder="Ej: Leche, Jabón de platos..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Categoría</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                        placeholder="Ej: Lácteos"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Prioridad</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                    >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cantidad Ideal</label>
                                    <input
                                        type="number"
                                        value={formData.targetQuantity}
                                        onChange={e => setFormData({ ...formData, targetQuantity: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                        placeholder="Ej: 2"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Unidad</label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                        placeholder="litros, kg, c/u..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white h-24 resize-none"
                                    placeholder="Marca preferida, detalles..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/30"
                            >
                                {editingItem ? 'Actualizar Producto' : 'Guardar Producto'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Purchase Modal */}
            {showPurchaseModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 bg-emerald-600 flex justify-between items-center text-white">
                            <div>
                                <h2 className="text-xl font-bold">Registrar Compra</h2>
                                <p className="text-emerald-100 text-sm uppercase font-bold">{showPurchaseModal.name}</p>
                            </div>
                            <button onClick={() => setShowPurchaseModal(null)} className="text-emerald-100 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleRecordPurchase} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Precio Pagado</label>
                                <CalculatorInput
                                    value={purchaseData.price}
                                    onChange={val => setPurchaseData({ ...purchaseData, price: val })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Moneda</label>
                                    <select
                                        value={purchaseData.currency}
                                        onChange={e => setPurchaseData({ ...purchaseData, currency: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                    >
                                        <option value="NIO">NIO</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Tienda / Establecimiento</label>
                                    <input
                                        required
                                        type="text"
                                        value={purchaseData.store}
                                        onChange={e => setPurchaseData({ ...purchaseData, store: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                        placeholder="Ej: Walmart"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cantidad comprada (opcional)</label>
                                <input
                                    type="number"
                                    value={purchaseData.quantity}
                                    onChange={e => setPurchaseData({ ...purchaseData, quantity: e.target.value })}
                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                    placeholder={showPurchaseModal.unit ? `Ej: ${showPurchaseModal.targetQuantity || '1'}` : '1'}
                                />
                            </div>

                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Historial Sugerido</h4>
                                {showPurchaseModal.history.length > 0 ? (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Última vez:</span>
                                        <span className="text-emerald-400 font-bold">
                                            {showPurchaseModal.history[0].currency} {Number(showPurchaseModal.history[0].price).toLocaleString()}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600">Primer registro para este producto</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/30"
                            >
                                Confirmar Compra
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
