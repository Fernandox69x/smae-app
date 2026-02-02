import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Link2,
    Mail,
    Settings,
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Loader2,
    GripVertical,
    FolderOpen
} from 'lucide-react';
import { config } from '../../../config';
import { useAuth } from '../../context/AuthContext';

interface SocialLink {
    id: string;
    name: string;
    url: string;
    icon: string;
    order: number;
    isActive: boolean;
}

const ICON_OPTIONS = ['github', 'linkedin', 'twitter', 'mail', 'instagram', 'youtube', 'globe', 'facebook'];

export function AdminSocialLinks() {
    const { token } = useAuth();
    const [links, setLinks] = useState<SocialLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newLink, setNewLink] = useState({ name: '', url: '', icon: 'globe' });

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const res = await fetch(`${config.API_URL}/admin/social-links`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLinks(data);
            }
        } catch (err) {
            console.error('Error fetching links:', err);
        } finally {
            setLoading(false);
        }
    };

    const addLink = async () => {
        if (!newLink.name || !newLink.url) return;

        setSaving(true);
        try {
            const res = await fetch(`${config.API_URL}/admin/social-links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newLink)
            });
            if (res.ok) {
                const created = await res.json();
                setLinks([...links, created]);
                setNewLink({ name: '', url: '', icon: 'globe' });
            }
        } catch (err) {
            console.error('Error creating link:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateLink = async (id: string, updates: Partial<SocialLink>) => {
        try {
            const res = await fetch(`${config.API_URL}/admin/social-links/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                setLinks(links.map(l => l.id === id ? { ...l, ...updates } : l));
            }
        } catch (err) {
            console.error('Error updating link:', err);
        }
    };

    const deleteLink = async (id: string) => {
        if (!confirm('¿Eliminar este enlace?')) return;

        try {
            const res = await fetch(`${config.API_URL}/admin/social-links/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setLinks(links.filter(l => l.id !== id));
            }
        } catch (err) {
            console.error('Error deleting link:', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-4">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-emerald-400">Admin Panel</h1>
                </div>

                <nav className="space-y-2">
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link to="/admin/projects" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <FolderOpen size={18} />
                        Proyectos
                    </Link>
                    <Link to="/admin/social-links" className="flex items-center gap-3 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
                        <Link2 size={18} />
                        Redes Sociales
                    </Link>
                    <Link to="/admin/contacts" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Mail size={18} />
                        Mensajes
                    </Link>
                    <Link to="/admin/config" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Settings size={18} />
                        Configuración
                    </Link>
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-white text-sm">
                        <ArrowLeft size={14} />
                        Volver al Portfolio
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <h2 className="text-2xl font-bold mb-8">Redes Sociales</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Add New Link */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold mb-4">Agregar Nuevo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre (ej: GitHub)"
                                    value={newLink.name}
                                    onChange={e => setNewLink({ ...newLink, name: e.target.value })}
                                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                />
                                <input
                                    type="url"
                                    placeholder="URL"
                                    value={newLink.url}
                                    onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                />
                                <select
                                    value={newLink.icon}
                                    onChange={e => setNewLink({ ...newLink, icon: e.target.value })}
                                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                >
                                    {ICON_OPTIONS.map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={addLink}
                                    disabled={saving || !newLink.name || !newLink.url}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg font-medium"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Agregar
                                </button>
                            </div>
                        </div>

                        {/* Links List */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Orden</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Nombre</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">URL</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Icono</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Activo</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {links.map((link) => (
                                        <tr key={link.id} className="hover:bg-slate-700/30">
                                            <td className="px-4 py-3">
                                                <GripVertical size={16} className="text-slate-500" />
                                            </td>
                                            <td className="px-4 py-3 font-medium">{link.name}</td>
                                            <td className="px-4 py-3 text-slate-400 text-sm max-w-xs truncate">{link.url}</td>
                                            <td className="px-4 py-3 text-slate-400">{link.icon}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => updateLink(link.id, { isActive: !link.isActive })}
                                                    className={`px-2 py-1 rounded text-xs font-medium ${link.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-400'
                                                        }`}
                                                >
                                                    {link.isActive ? 'Sí' : 'No'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => deleteLink(link.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {links.length === 0 && (
                                <p className="text-center py-8 text-slate-500">No hay enlaces configurados</p>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
