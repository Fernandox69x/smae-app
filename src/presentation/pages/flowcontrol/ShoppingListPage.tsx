import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingBag,
    Plus,
    Search,
    Trash2,
    CheckCircle2,
    Store,
    Loader2,
    Edit2,
    X,
    Minus,
    ShoppingCart,
    Utensils,
    AlertCircle,
    ChevronRight,
    Package
} from 'lucide-react';
import { config } from '../../../config';
import { CalculatorInput } from '../../components/flowcontrol/CalculatorInput';

interface PurchaseHistory {
    id: string;
    price: number;
    currency: string;
    store: string;
    purchaseDate: string;
    quantity: number | null;
}

interface ShoppingItem {
    id: string;
    name: string;
    category: string | null;
    isInStock: boolean;
    currentStock: number;
    minStock: number;
    maxStock: number | null;
    isPerishable: boolean;
    priority: 'low' | 'medium' | 'high';
    targetQuantity: number | null;
    unit: string | null;
    notes: string | null;
    history: PurchaseHistory[];
}

interface CartItem {
    item: ShoppingItem;
    quantity: number;
    price: number;
    notes?: string;
}

export default function ShoppingListPage() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState<ShoppingItem | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState<ShoppingItem | null>(null);
    const [fullHistory, setFullHistory] = useState<PurchaseHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

    // Form state for new/edit item
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        priority: 'medium',
        targetQuantity: '',
        unit: '',
        notes: '',
        currentStock: '0',
        minStock: '0',
        maxStock: '',
        isPerishable: false
    });

    // Form state for recording purchase
    const [purchaseData, setPurchaseData] = useState({
        price: '',
        currency: 'NIO',
        store: '',
        quantity: '1',
        notes: ''
    });

    // Cart / Ticket states
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCartModal, setShowCartModal] = useState(false);
    const [cartStore, setCartStore] = useState('');
    const [cartNotes, setCartNotes] = useState('');

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
                    targetQuantity: formData.targetQuantity ? Number(formData.targetQuantity) : null,
                    currentStock: Number(formData.currentStock),
                    minStock: Number(formData.minStock),
                    maxStock: formData.maxStock ? Number(formData.maxStock) : null
                })
            });

            if (res.ok) {
                setShowForm(false);
                setEditingItem(null);
                setFormData({
                    name: '', category: '', priority: 'medium', targetQuantity: '', unit: '', notes: '',
                    currentStock: '0', minStock: '0', maxStock: '', isPerishable: false
                });
                fetchItems();
            }
        } catch (error) {
            console.error('Error saving shopping item:', error);
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
                    quantity: Number(purchaseData.quantity)
                })
            });

            if (res.ok) {
                setShowPurchaseModal(null);
                setPurchaseData({ price: '', currency: 'NIO', store: '', quantity: '1', notes: '' });
                fetchItems();
            }
        } catch (error) {
            console.error('Error recording purchase:', error);
        }
    };

    const handleConsume = async (itemId: string, quantity: number) => {
        try {
            const res = await fetch(`${config.API_URL}/shopping/consume`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId, quantity })
            });

            if (res.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error('Error consuming item:', error);
        }
    };

    const addToCart = (item: ShoppingItem) => {
        if (cart.find(i => i.item.id === item.id)) return;
        setCart([...cart, { item, quantity: 1, price: 0 }]);
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(i => i.item.id !== id));
    };

    const updateCartItem = (id: string, updates: Partial<CartItem>) => {
        setCart(cart.map(i => i.item.id === id ? { ...i, ...updates } : i));
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cartStore || cart.length === 0) return;

        try {
            const res = await fetch(`${config.API_URL}/shopping/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    store: cartStore,
                    notes: cartNotes,
                    items: cart.map(i => ({
                        itemId: i.item.id,
                        price: i.price,
                        quantity: i.quantity,
                        notes: i.notes
                    }))
                })
            });

            if (res.ok) {
                setCart([]);
                setCartStore('');
                setCartNotes('');
                setShowCartModal(false);
                fetchItems();
            }
        } catch (error) {
            console.error('Error in checkout:', error);
        }
    };

    const fetchHistory = async (itemId: string) => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`${config.API_URL}/shopping/items/${itemId}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFullHistory(data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDeleteHistory = async (historyId: string, revertStock: boolean) => {
        if (!confirm(`¿Seguro que quieres eliminar este registro? ${revertStock ? '(Se restará del stock actual)' : ''}`)) return;
        try {
            const res = await fetch(`${config.API_URL}/shopping/history/${historyId}?revertStock=${revertStock}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                if (showHistoryModal) fetchHistory(showHistoryModal.id);
                fetchItems();
            }
        } catch (error) {
            console.error('Error deleting history entry:', error);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filter.toLowerCase()) ||
            (item.category?.toLowerCase().includes(filter.toLowerCase()));

        if (showOnlyLowStock) {
            return matchesSearch && item.currentStock <= item.minStock;
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

                    <div className="flex gap-4">
                        {cart.length > 0 && (
                            <button
                                onClick={() => setShowCartModal(true)}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                            >
                                <ShoppingCart size={20} />
                                Lista de Compra ({cart.length})
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setFormData({
                                    name: '', category: '', priority: 'medium', targetQuantity: '', unit: '', notes: '',
                                    currentStock: '0', minStock: '0', maxStock: '', isPerishable: false
                                });
                                setShowForm(true);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                        >
                            <Plus size={20} />
                            Nuevo Producto
                        </button>
                    </div>
                </div>

                {/* Filter & Search */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                        <button
                            onClick={() => setShowOnlyLowStock(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${!showOnlyLowStock ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Package size={18} />
                            Inventario Completo
                        </button>
                        <button
                            onClick={() => setShowOnlyLowStock(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${showOnlyLowStock ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ShoppingBag size={18} />
                            Por Comprar / Stock Bajo
                            {items.filter(i => i.currentStock <= i.minStock).length > 0 && (
                                <span className="bg-white text-red-600 text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-black">
                                    {items.filter(i => i.currentStock <= i.minStock).length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pl-12 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 shadow-inner"
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
                                                    notes: item.notes || '',
                                                    currentStock: item.currentStock.toString(),
                                                    minStock: item.minStock.toString(),
                                                    maxStock: item.maxStock?.toString() || '',
                                                    isPerishable: item.isPerishable
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

                                <div className="space-y-4 mb-6">
                                    {/* Stock Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] text-slate-500 uppercase font-black">Stock Actual</span>
                                            <span className={`text-xs font-bold ${item.currentStock <= item.minStock ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {item.currentStock} / {item.maxStock || item.targetQuantity || '∞'} {item.unit}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                            <div
                                                className={`h-full transition-all duration-500 ${item.currentStock <= item.minStock ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, (item.currentStock / (Number(item.maxStock) || Number(item.targetQuantity) || 10)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Mínimo</p>
                                            <p className="text-xs font-bold text-white">{item.minStock} {item.unit}</p>
                                        </div>
                                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Estado</p>
                                            <div className="flex items-center gap-1.5">
                                                {item.currentStock <= item.minStock ? (
                                                    <AlertCircle size={12} className="text-red-400" />
                                                ) : (
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                )}
                                                <span className={`text-[10px] font-bold ${item.currentStock <= item.minStock ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {item.currentStock <= item.minStock ? 'Reabastecer' : 'Stock OK'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {item.isPerishable && (
                                        <div className="flex items-center gap-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                            <Utensils size={12} className="text-amber-500" />
                                            <span className="text-[10px] text-amber-200/70 font-bold uppercase italic">Producto Perecedero</span>
                                        </div>
                                    )}
                                </div>

                                {/* History Mini Info */}
                                {item.history.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                                            <span>Última Compra</span>
                                            <button
                                                onClick={() => {
                                                    setShowHistoryModal(item);
                                                    fetchHistory(item.id);
                                                }}
                                                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                Ver Historial <ChevronRight size={10} />
                                            </button>
                                        </div>
                                        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 italic">
                                                    {item.history[0].quantity || 1} {item.unit} x {item.history[0].currency} {Number(item.history[0].price).toLocaleString()}
                                                </span>
                                                <span className="text-slate-500 text-[10px]">
                                                    {new Date(item.history[0].purchaseDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold">Total</span>
                                                <span className="text-emerald-400 font-black text-base">
                                                    {item.history[0].currency} {(Number(item.history[0].price) * Number(item.history[0].quantity || 1)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-1 flex-1">
                                        <button
                                            onClick={() => handleConsume(item.id, 1)}
                                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <div className="flex-1 flex items-center justify-center font-bold text-sm">
                                            {item.currentStock}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowPurchaseModal(item);
                                                setPurchaseData({ ...purchaseData, quantity: '1' });
                                            }}
                                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {!cart.find(i => i.item.id === item.id) ? (
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                                            title="Agregar a lista de compras"
                                        >
                                            <ShoppingCart size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all"
                                            title="Quitar de la lista"
                                        >
                                            <X size={18} />
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
                        <div className="p-6 bg-indigo-600 flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold">
                                {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-indigo-100 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveItem} className="p-6 space-y-4 bg-slate-900 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Nombre del Producto</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
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

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Stock Actual</label>
                                    <input
                                        type="number"
                                        value={formData.currentStock}
                                        onChange={e => setFormData({ ...formData, currentStock: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Stock Mín.</label>
                                    <input
                                        type="number"
                                        value={formData.minStock}
                                        onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Stock Máx.</label>
                                    <input
                                        type="number"
                                        value={formData.maxStock}
                                        onChange={e => setFormData({ ...formData, maxStock: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cantidad Ideal</label>
                                    <input
                                        type="number"
                                        value={formData.targetQuantity}
                                        onChange={e => setFormData({ ...formData, targetQuantity: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                        placeholder="Ej: 2"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Unidad</label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                        placeholder="litros, kg, c/u..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-xl border border-slate-700">
                                <input
                                    type="checkbox"
                                    id="isPerishable"
                                    checked={formData.isPerishable}
                                    onChange={e => setFormData({ ...formData, isPerishable: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                                />
                                <label htmlFor="isPerishable" className="text-sm font-bold text-slate-300 cursor-pointer">
                                    ¿Es un producto perecedero?
                                </label>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white h-20 resize-none"
                                    placeholder="Marca preferida, detalles..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30"
                            >
                                {editingItem ? 'Actualizar Producto' : 'Guardar Producto'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Purchase Modal (Single Item) */}
            {showPurchaseModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-indigo-600 flex justify-between items-center text-white shrink-0">
                            <div>
                                <h2 className="text-xl font-bold font-montserrat">Registrar Compra Rápida</h2>
                                <p className="text-indigo-100 text-sm uppercase font-bold">{showPurchaseModal.name}</p>
                            </div>
                            <button onClick={() => setShowPurchaseModal(null)} className="text-indigo-100 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleRecordPurchase} className="p-6 space-y-4 bg-slate-900 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Precio Pagado (Unitario)</label>
                                <CalculatorInput
                                    value={purchaseData.price}
                                    onChange={val => setPurchaseData({ ...purchaseData, price: val.toString() })}
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
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Cantidad comprada</label>
                                <input
                                    type="number"
                                    value={purchaseData.quantity}
                                    onChange={e => setPurchaseData({ ...purchaseData, quantity: e.target.value })}
                                    className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30"
                            >
                                Confirmar Compra
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Cart / Ticket Modal */}
            {showCartModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-indigo-600 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <ShoppingCart size={24} />
                                <div>
                                    <h2 className="text-xl font-bold">Completar Compra Agrupada</h2>
                                    <p className="text-indigo-100 text-sm">Estas registrando un "ticket" o salida de compras</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCartModal(false)} className="text-indigo-100 hover:text-white"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleCheckout} className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-800 shrink-0">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Comercio / Tienda</label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            required
                                            type="text"
                                            value={cartStore}
                                            onChange={e => setCartStore(e.target.value)}
                                            className="w-full bg-slate-800 border-0 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                            placeholder="Ej: Walmart, La Colonia..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Notas del Ticket</label>
                                    <input
                                        type="text"
                                        value={cartNotes}
                                        onChange={e => setCartNotes(e.target.value)}
                                        className="w-full bg-slate-800 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                        placeholder="Ej: Compras del mes, Súper semanal..."
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <div className="min-w-[500px]">
                                    <table className="w-full">
                                        <thead className="text-left border-b border-slate-800 text-[10px] uppercase font-black text-slate-500">
                                            <tr>
                                                <th className="pb-4">Producto</th>
                                                <th className="pb-4">Cantidad</th>
                                                <th className="pb-4">Precio Unit.</th>
                                                <th className="pb-4 text-right">Total</th>
                                                <th className="pb-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {cart.map((item) => (
                                                <tr key={item.item.id} className="border-b border-slate-800/50 group">
                                                    <td className="py-4">
                                                        <div className="font-bold text-white uppercase">{item.item.name}</div>
                                                        <div className="text-[10px] text-slate-500">{item.item.category}</div>
                                                    </td>
                                                    <td className="py-4">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => updateCartItem(item.item.id, { quantity: Number(e.target.value) })}
                                                            className="w-20 bg-slate-800 border-0 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-center"
                                                        />
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">C$</span>
                                                            <input
                                                                type="number"
                                                                value={item.price}
                                                                onChange={e => updateCartItem(item.item.id, { price: Number(e.target.value) })}
                                                                className="w-24 bg-slate-800 border-0 rounded-lg p-2 pl-7 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right font-bold text-indigo-400">
                                                        C$ {(item.price * item.quantity).toLocaleString()}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(item.item.id)}
                                                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-900 border-t border-slate-800 shrink-0 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total del Ticket</span>
                                    <span className="text-2xl font-black text-white">
                                        C$ {cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCartModal(false)}
                                        className="px-6 py-3 text-slate-400 font-bold hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                                    >
                                        Finalizar Compra
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-6 bg-indigo-600 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Historial de Precios</h2>
                                    <p className="text-indigo-100 text-sm font-bold uppercase">{showHistoryModal.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHistoryModal(null)} className="text-indigo-100 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900">
                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
                                    <p className="text-slate-400 font-bold">Cargando historial...</p>
                                </div>
                            ) : fullHistory.length === 0 ? (
                                <div className="text-center py-20 text-slate-500 italic">
                                    No hay registros de compras anteriores.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {fullHistory.map((entry) => (
                                        <div key={entry.id} className="group bg-slate-950/50 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Store size={14} className="text-slate-500" />
                                                        <span className="text-sm font-bold text-white">{entry.store}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black">
                                                        {new Date(entry.purchaseDate).toLocaleDateString(undefined, {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDeleteHistory(entry.id, true)}
                                                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                        title="Eliminar y revertir stock"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                                                <div className="text-xs text-slate-400 italic">
                                                    {entry.quantity || 1} {showHistoryModal.unit} x {entry.currency} {Number(entry.price).toLocaleString()}
                                                </div>
                                                <div className="text-indigo-400 font-black text-lg">
                                                    {entry.currency} {(Number(entry.price) * Number(entry.quantity || 1)).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
