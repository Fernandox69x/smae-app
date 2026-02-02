import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Eye,
    Mail,
    Link2,
    Settings,
    ArrowLeft,
    TrendingUp,
    MessageSquare,
    Loader2,
    MailOpen,
    FolderOpen
} from 'lucide-react';
import { config } from '../../../config';
import { useAuth } from '../../context/AuthContext';

interface Stats {
    users: { total: number; thisMonth: number };
    visits: { total: number; today: number; thisMonth: number; byPage: { path: string; count: number }[] };
    contacts: { total: number; unread: number; recent: Array<{ id: string; name: string; email: string; subject: string; isRead: boolean; createdAt: string }> };
    skills: { total: number };
}

export function AdminDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${config.API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 403) {
                setError('No tienes permisos de administrador');
                return;
            }

            if (!res.ok) throw new Error('Error fetching stats');

            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError('Error al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Link to="/" className="text-emerald-400 hover:underline">Volver al inicio</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-4">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-emerald-400">Admin Panel</h1>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                </div>

                <nav className="space-y-2">
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link to="/admin/projects" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <FolderOpen size={18} />
                        Proyectos
                    </Link>
                    <Link to="/admin/social-links" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Link2 size={18} />
                        Redes Sociales
                    </Link>
                    <Link to="/admin/contacts" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Mail size={18} />
                        Mensajes
                        {stats && stats.contacts.unread > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {stats.contacts.unread}
                            </span>
                        )}
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
                <h2 className="text-2xl font-bold mb-8">Dashboard</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <Users size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats?.users.total || 0}</p>
                                <p className="text-sm text-slate-500">Usuarios Registrados</p>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                            +{stats?.users.thisMonth || 0} este mes
                        </p>
                    </div>

                    <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                                <Eye size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats?.visits.total || 0}</p>
                                <p className="text-sm text-slate-500">Visitas Totales</p>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                            {stats?.visits.today || 0} hoy • {stats?.visits.thisMonth || 0} este mes
                        </p>
                    </div>

                    <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-violet-500/20 rounded-xl">
                                <MessageSquare size={24} className="text-violet-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats?.contacts.total || 0}</p>
                                <p className="text-sm text-slate-500">Mensajes de Contacto</p>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                            {stats?.contacts.unread || 0} sin leer
                        </p>
                    </div>

                    <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl">
                                <TrendingUp size={24} className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats?.skills.total || 0}</p>
                                <p className="text-sm text-slate-500">Skills en SMAE</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Contacts */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Mensajes Recientes</h3>
                        <Link to="/admin/contacts" className="text-emerald-400 text-sm hover:underline">
                            Ver todos
                        </Link>
                    </div>

                    {stats?.contacts.recent.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No hay mensajes aún</p>
                    ) : (
                        <div className="space-y-3">
                            {stats?.contacts.recent.map(contact => (
                                <div key={contact.id} className={`p-4 rounded-lg border ${contact.isRead ? 'bg-slate-700/30 border-slate-700' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {!contact.isRead && <MailOpen size={14} className="text-emerald-400" />}
                                                <span className="font-medium">{contact.name}</span>
                                                <span className="text-slate-500 text-sm">&lt;{contact.email}&gt;</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">{contact.subject}</p>
                                        </div>
                                        <span className="text-xs text-slate-500">
                                            {new Date(contact.createdAt).toLocaleDateString('es-ES')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
