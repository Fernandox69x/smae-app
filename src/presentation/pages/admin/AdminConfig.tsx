import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Link2,
    Mail,
    Settings,
    ArrowLeft,
    Loader2,
    Save,
    FolderOpen
} from 'lucide-react';
import { config } from '../../../config';
import { useAuth } from '../../context/AuthContext';

interface ConfigData {
    hero: {
        title: string;
        subtitle: string;
        description: string;
    };
    about: {
        bio: string;
        location: string;
    };
    profile: {
        name: string;
        email: string;
    };
}

const defaultConfig: ConfigData = {
    hero: { title: 'Fernando', subtitle: 'Desarrollador Full Stack', description: '' },
    about: { bio: '', location: '' },
    profile: { name: 'Fernando', email: '' }
};

export function AdminConfig() {
    const { token } = useAuth();
    const [configData, setConfigData] = useState<ConfigData>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const keys = ['hero', 'about', 'profile'];
            const results = await Promise.all(
                keys.map(key =>
                    fetch(`${config.API_URL}/admin/config/${key}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => res.ok ? res.json() : null)
                )
            );

            setConfigData({
                hero: results[0] || defaultConfig.hero,
                about: results[1] || defaultConfig.about,
                profile: results[2] || defaultConfig.profile
            });
        } catch (err) {
            console.error('Error fetching config:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (key: keyof ConfigData) => {
        setSaving(key);
        try {
            await fetch(`${config.API_URL}/admin/config/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ value: configData[key] })
            });
        } catch (err) {
            console.error('Error saving config:', err);
        } finally {
            setSaving(null);
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
                    <Link to="/admin/social-links" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Link2 size={18} />
                        Redes Sociales
                    </Link>
                    <Link to="/admin/contacts" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg">
                        <Mail size={18} />
                        Mensajes
                    </Link>
                    <Link to="/admin/config" className="flex items-center gap-3 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
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
                <h2 className="text-2xl font-bold mb-8">Configuración del Portfolio</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Hero Section Config */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Hero / Cabecera</h3>
                                <button
                                    onClick={() => saveConfig('hero')}
                                    disabled={saving === 'hero'}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium"
                                >
                                    {saving === 'hero' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Guardar
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={configData.hero.title}
                                        onChange={e => setConfigData({
                                            ...configData,
                                            hero: { ...configData.hero, title: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Subtítulo</label>
                                    <input
                                        type="text"
                                        value={configData.hero.subtitle}
                                        onChange={e => setConfigData({
                                            ...configData,
                                            hero: { ...configData.hero, subtitle: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                                    <textarea
                                        value={configData.hero.description}
                                        onChange={e => setConfigData({
                                            ...configData,
                                            hero: { ...configData.hero, description: e.target.value }
                                        })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Profile Config */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Perfil</h3>
                                <button
                                    onClick={() => saveConfig('profile')}
                                    disabled={saving === 'profile'}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium"
                                >
                                    {saving === 'profile' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Guardar
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={configData.profile.name}
                                        onChange={e => setConfigData({
                                            ...configData,
                                            profile: { ...configData.profile, name: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Email público</label>
                                    <input
                                        type="email"
                                        value={configData.profile.email}
                                        onChange={e => setConfigData({
                                            ...configData,
                                            profile: { ...configData.profile, email: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* About Config */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Sobre Mí</h3>
                                <button
                                    onClick={() => saveConfig('about')}
                                    disabled={saving === 'about'}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium"
                                >
                                    {saving === 'about' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Guardar
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Ubicación</label>
                                    <input
                                        type="text"
                                        value={configData.about.location}
                                        onChange={e => setConfigData({
                                            ...configData,
                                            about: { ...configData.about, location: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Biografía</label>
                                    <textarea
                                        value={configData.about.bio}
                                        onChange={e => setConfigData({
                                            ...configData,
                                            about: { ...configData.about, bio: e.target.value }
                                        })}
                                        rows={5}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
