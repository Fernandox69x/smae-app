import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Link2,
    Mail,
    Settings,
    ArrowLeft,
    Loader2,
    MailOpen,
    MailCheck,
    Trash2,
    ChevronDown,
    ChevronUp,
    FolderOpen
} from 'lucide-react';
import { config } from '../../../config';
import { useAuth } from '../../context/AuthContext';

interface Contact {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export function AdminContacts() {
    const { token } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const res = await fetch(`${config.API_URL}/admin/contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (err) {
            console.error('Error fetching contacts:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRead = async (id: string, isRead: boolean) => {
        try {
            const res = await fetch(`${config.API_URL}/admin/contacts/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isRead: !isRead })
            });
            if (res.ok) {
                setContacts(contacts.map(c => c.id === id ? { ...c, isRead: !isRead } : c));
            }
        } catch (err) {
            console.error('Error updating contact:', err);
        }
    };

    const deleteContact = async (id: string) => {
        if (!confirm('¿Eliminar este mensaje?')) return;

        try {
            const res = await fetch(`${config.API_URL}/admin/contacts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setContacts(contacts.filter(c => c.id !== id));
            }
        } catch (err) {
            console.error('Error deleting contact:', err);
        }
    };

    const unreadCount = contacts.filter(c => !c.isRead).length;

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
                    <Link to="/admin/social-links" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Link2 size={18} />
                        Redes Sociales
                    </Link>
                    <Link to="/admin/contacts" className="flex items-center gap-3 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
                        <Mail size={18} />
                        Mensajes
                        {unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount}
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
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Mensajes de Contacto</h2>
                    <span className="text-slate-500">{contacts.length} mensajes • {unreadCount} sin leer</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-xl">
                        <Mail size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-500">No hay mensajes aún</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {contacts.map((contact) => (
                            <div
                                key={contact.id}
                                className={`bg-slate-800 border rounded-xl overflow-hidden ${contact.isRead ? 'border-slate-700' : 'border-emerald-500/50'
                                    }`}
                            >
                                <div
                                    className="p-4 cursor-pointer hover:bg-slate-700/30 flex items-center justify-between"
                                    onClick={() => {
                                        setExpandedId(expandedId === contact.id ? null : contact.id);
                                        if (!contact.isRead) toggleRead(contact.id, contact.isRead);
                                    }}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {contact.isRead ? (
                                            <MailCheck size={20} className="text-slate-500" />
                                        ) : (
                                            <MailOpen size={20} className="text-emerald-400" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium ${!contact.isRead && 'text-emerald-400'}`}>
                                                    {contact.name}
                                                </span>
                                                <span className="text-slate-500 text-sm">&lt;{contact.email}&gt;</span>
                                            </div>
                                            <p className="text-slate-400 text-sm truncate">{contact.subject}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-500">
                                            {new Date(contact.createdAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        {expandedId === contact.id ? (
                                            <ChevronUp size={18} className="text-slate-500" />
                                        ) : (
                                            <ChevronDown size={18} className="text-slate-500" />
                                        )}
                                    </div>
                                </div>

                                {expandedId === contact.id && (
                                    <div className="px-4 pb-4 border-t border-slate-700 pt-4">
                                        <p className="text-slate-300 whitespace-pre-wrap mb-4">{contact.message}</p>
                                        <div className="flex gap-3">
                                            <a
                                                href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
                                            >
                                                Responder
                                            </a>
                                            <button
                                                onClick={() => toggleRead(contact.id, contact.isRead)}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium"
                                            >
                                                Marcar como {contact.isRead ? 'no leído' : 'leído'}
                                            </button>
                                            <button
                                                onClick={() => deleteContact(contact.id)}
                                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium flex items-center gap-2"
                                            >
                                                <Trash2 size={14} />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
