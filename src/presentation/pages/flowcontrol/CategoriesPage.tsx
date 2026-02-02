import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    Tag,
    Grid,
    Info
} from 'lucide-react';
import { config } from '../../../config';

interface Category {
    id: string;
    name: string;
    type: string;
    color: string;
    icon: string | null;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b'];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({
        name: '',
        type: 'expense',
        color: '#6366f1',
        icon: 'Tag'
    });

    const token = localStorage.getItem('token');

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const createCategory = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/categories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCategory)
            });

            if (res.ok) {
                fetchCategories();
                setShowForm(false);
                setNewCategory({ name: '', type: 'expense', color: '#6366f1', icon: 'Tag' });
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm('¿Eliminar esta categoría? Se desvinculará de sus transacciones.')) return;

        try {
            await fetch(`${config.API_URL}/flowcontrol/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCategories();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const updateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;

        try {
            const res = await fetch(`${config.API_URL}/flowcontrol/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editingCategory.name,
                    type: editingCategory.type,
                    color: editingCategory.color,
                    icon: editingCategory.icon
                })
            });

            if (res.ok) {
                fetchCategories();
                setEditingCategory(null);
            }
        } catch (err) {
            console.error('Error:', err);
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
                        <h1 className="text-2xl font-bold">Categorías</h1>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                        <Plus size={18} /> Nueva Categoría
                    </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Info size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
                    <p className="text-sm text-slate-400">
                        Las categorías ayudan a clasificar tus gastos e ingresos. Puedes personalizar el nombre, color y tipo para organizar mejor tus finanzas.
                    </p>
                </div>

                {/* Categories Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                        >
                                            <Tag size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{cat.name}</h3>
                                            <span className={`text-xs uppercase tracking-wider ${cat.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingCategory(cat)}
                                            className="p-1.5 text-slate-500 hover:text-indigo-400"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => deleteCategory(cat.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {categories.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <Grid size={48} className="mx-auto mb-4 text-slate-700" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Sin Categorías</h3>
                        <p className="text-slate-500">Agrega categorías para organizar tus transacciones</p>
                    </div>
                )}

                {/* Create Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
                            <h2 className="text-xl font-bold mb-6">Nueva Categoría</h2>
                            <form onSubmit={createCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                        placeholder="Ej: Alimentación"
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewCategory({ ...newCategory, type: 'expense' })}
                                            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors ${newCategory.type === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                        >
                                            Gasto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewCategory({ ...newCategory, type: 'income' })}
                                            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors ${newCategory.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                        >
                                            Ingreso
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setNewCategory({ ...newCategory, color: c })}
                                                className={`w-8 h-8 rounded-lg ${newCategory.color === c ? 'ring-2 ring-white' : ''}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
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
                                        Crear
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Form Modal */}
                {editingCategory && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
                            <h2 className="text-xl font-bold mb-6">Editar Categoría</h2>
                            <form onSubmit={updateCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={editingCategory.name}
                                        onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        required
                                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingCategory({ ...editingCategory, type: 'expense' })}
                                            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors ${editingCategory.type === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                        >
                                            Gasto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingCategory({ ...editingCategory, type: 'income' })}
                                            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors ${editingCategory.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                        >
                                            Ingreso
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setEditingCategory({ ...editingCategory, color: c })}
                                                className={`w-8 h-8 rounded-lg ${editingCategory.color === c ? 'ring-2 ring-white' : ''}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingCategory(null)}
                                        className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-semibold"
                                    >
                                        Guardar
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
